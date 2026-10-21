import { memo, ReactNode, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  interpolateColor,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const WAVE_H = 44;
const WAVE_BASE = 26;
const AMP = 7;
const SEGMENTS = 28;

export type LiquidProps = {
  /** 0..1 — fração do líquido restante (tempo restante / duração). */
  fill: SharedValue<number>;
  colorFrom: SharedValue<string>;
  colorTo: SharedValue<string>;
  /** 0..1 — progresso da inundação da nova cor a partir de (fx, fy). */
  flood: SharedValue<number>;
  fx: SharedValue<number>;
  fy: SharedValue<number>;
  /** 0..1 — reforço momentâneo da amplitude da onda. */
  boost: SharedValue<number>;
  /** Camada desenhada DENTRO do líquido (relógio escuro). Ocupa a tela inteira. */
  children?: ReactNode;
};

/**
 * Líquido que preenche a tela de baixo para cima. Tudo no UI thread:
 * altura = fill * tela, superfície ondulada (SVG path animado) e inundação de cor circular.
 * O conteúdo `children` fica recortado pelo líquido (texto escuro dentro, claro fora).
 */
export const Liquid = memo(({ fill, colorFrom, colorTo, flood, fx, fy, boost, children }: LiquidProps) => {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);
  const radius = Math.hypot(width, height);

  useEffect(() => {
    if (reduced) return;
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1, false);
  }, [phase, reduced]);

  const containerStyle = useAnimatedStyle(() => ({ height: fill.value * height }));
  const clipStyle = useAnimatedStyle(() => ({ backgroundColor: colorFrom.value }));
  const floodStyle = useAnimatedStyle(() => ({
    left: fx.value - radius,
    top: fy.value - radius,
    backgroundColor: colorTo.value,
    transform: [{ scale: flood.value }],
  }));
  const waveWrapStyle = useAnimatedStyle(() => {
    const visible = Math.min(1, fill.value * 25);
    return { opacity: visible > 0.01 ? 1 : 0, transform: [{ translateY: (1 - visible) * WAVE_BASE }] };
  });
  const waveProps = useAnimatedProps(() => {
    const amp = reduced ? 0 : AMP * (1 + boost.value * 1.8);
    const ph = phase.value;
    let d = `M0 ${WAVE_H}`;
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const t = i / SEGMENTS;
      const y = WAVE_BASE + amp * (Math.sin(ph + t * Math.PI * 3) * 0.65 + Math.sin(-ph * 1.7 + t * Math.PI * 5.5) * 0.35);
      d += ` L${(t * width).toFixed(1)} ${y.toFixed(2)}`;
    }
    d += ` L${width} ${WAVE_H} Z`;
    return { d, fill: interpolateColor(flood.value, [0, 1], [colorFrom.value, colorTo.value]) } as object;
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { width }, containerStyle]}>
      <Animated.View style={[styles.waveWrap, { width }, waveWrapStyle]}>
        <Svg width={width} height={WAVE_H}>
          <AnimatedPath animatedProps={waveProps} d={`M0 ${WAVE_H} L${width} ${WAVE_H} Z`} fill="#FF7A1A" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.clip, clipStyle]}>
        <View style={[styles.inner, { width, height }]}>
          <Animated.View style={[styles.flood, { width: radius * 2, height: radius * 2, borderRadius: radius }, floodStyle]} />
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
});
Liquid.displayName = 'Liquid';

export type RippleProps = {
  fx: SharedValue<number>;
  fy: SharedValue<number>;
  /** 0..1 */
  progress: SharedValue<number>;
};

const RING = 140;

/** Anel que se expande a partir do ponto tocado. */
export const Ripple = memo(({ fx, fy, progress }: RippleProps) => {
  const style = useAnimatedStyle(() => ({
    left: fx.value - RING / 2,
    top: fy.value - RING / 2,
    opacity: progress.value <= 0 || progress.value >= 1 ? 0 : 0.6 * (1 - progress.value),
    transform: [{ scale: 0.2 + progress.value * 3.2 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.ring, style]} />;
});
Ripple.displayName = 'Ripple';

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, bottom: 0 },
  waveWrap: { position: 'absolute', left: 0, top: -WAVE_H + 1, height: WAVE_H },
  clip: { overflow: 'hidden' },
  inner: { position: 'absolute', left: 0, bottom: 0 },
  flood: { position: 'absolute' },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 4, borderColor: '#FFFFFF' },
});

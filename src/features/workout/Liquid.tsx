import { memo, ReactNode, useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SPEED_COLORS } from '../../domain/speed';
import { colors, fonts, withAlpha } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const WAVE_H = 44;
const WAVE_BASE = 26;
const AMP = 7;
const SEGMENTS = 28;
const PARTICLES = 16;
const GLOW_H = 70;
const BASE_SPEED = (Math.PI * 2) / 2.6; // rad/s

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
  /** Último round muito rápido: glow, bolhas e onda mais viva (desligado com reduce motion). */
  blazing?: boolean;
  /** 0..1 — nível (fração da tela) da linha da meta; <= 0 oculta. */
  targetFill?: SharedValue<number>;
  targetLabel?: string;
  /** Camada desenhada DENTRO do líquido (relógio escuro). Ocupa a tela inteira. */
  children?: ReactNode;
};

/**
 * Líquido que preenche a tela de baixo para cima. Tudo no UI thread:
 * altura = fill * tela, superfície ondulada (SVG path animado) e inundação de cor circular.
 * O conteúdo `children` fica recortado pelo líquido (texto escuro dentro, claro fora).
 */
export const Liquid = memo(({ fill, colorFrom, colorTo, flood, fx, fy, boost, blazing = false, targetFill, targetLabel, children }: LiquidProps) => {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);
  const level = useSharedValue(0); // 0..1 intensidade dos efeitos
  const ptime = useSharedValue(0);
  const radius = Math.hypot(width, height);
  const effects = blazing && !reduced;

  useEffect(() => {
    level.value = withTiming(effects ? 1 : 0, { duration: 450 });
  }, [effects, level]);

  // Um único loop de frame no UI thread: fase da onda (mais rápida quando em chamas) e tempo das bolhas.
  useFrameCallback((frame) => {
    if (reduced) return;
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    phase.value += dt * BASE_SPEED * (1 + 0.8 * level.value);
    if (level.value > 0.01) ptime.value += dt;
  });

  const bubbles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => ({
        x: ((i * 0.618034) % 1) * 0.92 + 0.04,
        size: 5 + ((i * 7) % 6),
        speed: 0.16 + ((i * 5) % 7) * 0.025,
        offset: (i * 0.37) % 1,
        sway: 6 + ((i * 3) % 5) * 3,
      })),
    [],
  );

  const glowStyle = useAnimatedStyle(() => ({ opacity: level.value * (0.5 + 0.3 * Math.sin(phase.value * 1.4)) }));
  const targetLineStyle = useAnimatedStyle(() => {
    const t = targetFill ? targetFill.value : 0;
    return { opacity: t > 0.001 && t < 1 ? 1 : 0, bottom: Math.max(0, t) * height - 2 };
  });

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
    const amp = reduced ? 0 : AMP * (1 + boost.value * 1.8 + level.value * 0.7);
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
    <>
    <Animated.View pointerEvents="none" style={[styles.container, { width }, containerStyle]}>
      <Animated.View pointerEvents="none" style={[styles.glow, { width }, glowStyle]}>
        <LinearGradient colors={[withAlpha(SPEED_COLORS.blazing, 0), withAlpha(SPEED_COLORS.blazing, 0.6)]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.waveWrap, { width }, waveWrapStyle]}>
        <Svg width={width} height={WAVE_H}>
          <AnimatedPath animatedProps={waveProps} d={`M0 ${WAVE_H} L${width} ${WAVE_H} Z`} fill={SPEED_COLORS.neutral} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.clip, clipStyle]}>
        <View style={[styles.inner, { width, height }]}>
          <Animated.View style={[styles.flood, { width: radius * 2, height: radius * 2, borderRadius: radius }, floodStyle]} />
          {effects
            ? bubbles.map((b, i) => (
                <Bubble key={i} spec={b} ptime={ptime} level={level} width={width} height={height} />
              ))
            : null}
          {children}
        </View>
      </Animated.View>
    </Animated.View>
    {targetFill && targetLabel ? (
      <Animated.View pointerEvents="none" style={[styles.target, { width }, targetLineStyle]}>
        <View style={styles.targetLine} />
        <View style={styles.targetPill}>
          <Text style={styles.targetText}>{targetLabel}</Text>
        </View>
      </Animated.View>
    ) : null}
    </>
  );
});
Liquid.displayName = 'Liquid';

type BubbleSpec = { x: number; size: number; speed: number; offset: number; sway: number };

/** Bolha subindo dentro do líquido (UI thread). Posicionada a partir da base do líquido. */
const Bubble = memo(({ spec, ptime, level, width, height }: { spec: BubbleSpec; ptime: SharedValue<number>; level: SharedValue<number>; width: number; height: number }) => {
  const style = useAnimatedStyle(() => {
    const p = (ptime.value * spec.speed + spec.offset) % 1;
    return {
      opacity: level.value * Math.sin(p * Math.PI) * 0.55,
      transform: [{ translateX: Math.sin(p * 9 + spec.offset * 6) * spec.sway }, { translateY: -p * height }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.bubble, { left: spec.x * width, width: spec.size, height: spec.size, borderRadius: spec.size / 2 }, style]} />;
});
Bubble.displayName = 'Bubble';

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
  glow: { position: 'absolute', left: 0, top: -GLOW_H - WAVE_H + 24, height: GLOW_H },
  bubble: { position: 'absolute', bottom: 0, backgroundColor: colors.text },
  target: { position: 'absolute', left: 0, height: 4, justifyContent: 'center' },
  targetLine: { height: 4, backgroundColor: colors.text, borderWidth: 1, borderColor: colors.bg, opacity: 0.9 },
  targetPill: { position: 'absolute', right: 12, top: -22, backgroundColor: colors.bg, borderColor: colors.text, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  targetText: { fontFamily: fonts.displaySemi, fontSize: 14, lineHeight: 18, letterSpacing: 1.5, color: colors.text },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 4, borderColor: colors.text },
});

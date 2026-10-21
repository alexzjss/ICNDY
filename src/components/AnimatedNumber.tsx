import { useEffect } from 'react';
import { StyleProp, StyleSheet, TextInput, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../theme';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

export type AnimatedNumberProps = {
  /** Valor final. */
  value: number;
  /** Valor inicial da primeira animação (padrão 0). Ignorado se animateOnMount=false. */
  from?: number;
  animateOnMount?: boolean;
  /** Duração da contagem em ms (padrão 900). */
  duration?: number;
  decimals?: number;
  /** 'number' (padrão) ou 'mmss' (interpreta o valor como segundos). */
  format?: 'number' | 'mmss';
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Número que conta até o valor no UI thread (Barlow, tabular). */
export const AnimatedNumber = ({
  value,
  from = 0,
  animateOnMount = true,
  duration = 900,
  decimals = 0,
  format = 'number',
  prefix = '',
  suffix = '',
  fontSize = 40,
  color = colors.text,
  style,
}: AnimatedNumberProps) => {
  const reduced = useReducedMotion();
  const progress = useSharedValue(animateOnMount && !reduced ? from : value);

  useEffect(() => {
    progress.value = reduced
      ? value
      : withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, reduced, progress]);

  const animatedProps = useAnimatedProps(() => {
    const v = progress.value;
    let text: string;
    if (format === 'mmss') {
      const total = Math.max(0, Math.round(v));
      const m = Math.floor(total / 60);
      const s = total % 60;
      text = `${m}:${s < 10 ? '0' : ''}${s}`;
    } else {
      text = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
    }
    const full = `${prefix}${text}${suffix}`;
    return { text: full, defaultValue: full } as object;
  });

  const initial = `${prefix}${format === 'mmss' ? '0:00' : (animateOnMount ? from : value).toFixed(decimals)}${suffix}`;

  return (
    <AnimatedInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={initial}
      animatedProps={animatedProps}
      style={[styles.base, { fontSize, lineHeight: fontSize * 1.1, color }, style]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.display,
    fontVariant: ['tabular-nums'],
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
});

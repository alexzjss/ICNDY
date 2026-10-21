import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, gradients, radius, withAlpha } from '../theme';
import { haptic, usePressScale } from './Motion';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const heights: Record<ButtonSize, number> = { sm: 40, md: 54, lg: 68 };
const fontSizes: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 26 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonProps = {
  children: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícone Ionicons à esquerda. */
  icon?: IconName;
  /** Ícone à direita. */
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa a largura toda (padrão true). */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const labelColor = (variant: ButtonVariant) =>
  variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.white : variant === 'ghost' ? colors.accent : colors.text;

/** Botão com spring de escala + haptic; variantes primary (gradiente), secondary, ghost, danger. */
export const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
}: ButtonProps) => {
  const press = usePressScale(0.98);
  const inactive = disabled || loading;
  const color = labelColor(variant);
  const content = loading ? (
    <ActivityIndicator color={color} />
  ) : (
    <View style={styles.content}>
      {icon ? <Ionicons name={icon} size={fontSizes[size] + 2} color={color} /> : null}
      <Text style={{ fontFamily: fonts.display, fontSize: fontSizes[size], lineHeight: fontSizes[size] * 1.15, color, letterSpacing: 0.4 }}>
        {children}
      </Text>
      {iconRight ? <Ionicons name={iconRight} size={fontSizes[size] + 2} color={color} /> : null}
    </View>
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={[
        styles.base,
        { minHeight: heights[size], alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        inactive && styles.disabled,
        press.style,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {content}
    </AnimatedPressable>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type HoldButtonProps = {
  /** Texto (apenas shape 'bar'). */
  children?: string;
  /** Chamado ao completar a segurada. */
  onComplete: () => void;
  /** Tempo necessário segurando, em ms (padrão 1000). */
  holdMs?: number;
  /** 'bar' = botão com barra de progresso; 'ring' = botão redondo com anel. */
  shape?: 'bar' | 'ring';
  icon?: IconName;
  variant?: 'danger' | 'secondary';
  size?: ButtonSize;
  /** Diâmetro do anel (padrão 44). */
  ringSize?: number;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
};

/** Botão que exige segurar por holdMs; mostra barra/anel de progresso e dispara onComplete. */
export const HoldButton = ({
  children,
  onComplete,
  holdMs = 1000,
  shape = 'bar',
  icon,
  variant = 'danger',
  size = 'md',
  ringSize = 44,
  fullWidth = true,
  disabled = false,
  style,
  accessibilityLabel,
}: HoldButtonProps) => {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const press = usePressScale(0.98);
  const tint = variant === 'danger' ? colors.danger : colors.text;

  useEffect(() => () => {
    progress.value = 0;
  }, [progress]);

  const complete = () => {
    haptic.success();
    onComplete();
  };

  const start = () => {
    press.onPressIn();
    haptic.light();
    progress.value = withTiming(1, { duration: holdMs, easing: Easing.linear }, (finished) => {
      if (finished) {
        runOnJS(complete)();
        progress.value = withTiming(0, { duration: reduced ? 0 : 300 });
      }
    });
  };
  const cancel = () => {
    press.onPressOut();
    if (progress.value < 1) progress.value = withTiming(0, { duration: reduced ? 0 : 200 });
  };

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const stroke = 3;
  const r = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  if (shape === 'ring') {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Segure para confirmar"
        disabled={disabled}
        onPressIn={start}
        onPressOut={cancel}
        style={[{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }, press.style, style]}
      >
        <Svg width={ringSize} height={ringSize} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={withAlpha(tint, 0.3)} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            stroke={tint}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={ringProps}
            rotation={-90}
            origin={`${ringSize / 2}, ${ringSize / 2}`}
          />
        </Svg>
        {icon ? <Ionicons name={icon} size={ringSize * 0.45} color={tint} /> : null}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Segure para confirmar"
      disabled={disabled}
      onPressIn={start}
      onPressOut={cancel}
      style={[
        styles.base,
        styles.secondary,
        { minHeight: heights[size], alignSelf: fullWidth ? 'stretch' : 'flex-start', borderColor: withAlpha(tint, 0.5) },
        disabled && styles.disabled,
        press.style,
        style,
      ]}
    >
      <Animated.View style={[styles.holdFill, { backgroundColor: withAlpha(tint, 0.35) }, barStyle]} />
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={fontSizes[size] + 2} color={tint} /> : null}
        <Text style={{ fontFamily: fonts.display, fontSize: fontSizes[size], lineHeight: fontSizes[size] * 1.15, color: tint, letterSpacing: 0.4 }}>
          {children}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

export type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  /** Obrigatório (acessibilidade). */
  accessibilityLabel: string;
  size?: number;
  color?: string;
  /** 'ghost' (sem fundo) ou 'solid' (fundo elevado). */
  variant?: 'ghost' | 'solid';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Botão de ícone redondo com spring e haptic leve. */
export const IconButton = ({
  icon,
  onPress,
  accessibilityLabel,
  size = 44,
  color = colors.text,
  variant = 'ghost',
  disabled = false,
  style,
}: IconButtonProps) => {
  const press = usePressScale(0.94);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        variant === 'solid' && { backgroundColor: colors.surfaceRaised },
        disabled && styles.disabled,
        press.style,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.4 },
  holdFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
});

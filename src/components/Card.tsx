import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { colors, radius, spacing, withAlpha } from '../theme';
import { Button } from './Button';
import { haptic, usePressScale } from './Motion';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardProps = {
  children?: ReactNode;
  /** Se definido, o card vira pressable com spring de escala. */
  onPress?: () => void;
  /** Cor de destaque da borda (ex. cor do movimento). */
  accent?: string;
  /** Remove o padding interno. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Animação de entrada/saída/layout do Reanimated (prop `entering` etc.). */
  entering?: React.ComponentProps<typeof Animated.View>['entering'];
  layout?: React.ComponentProps<typeof Animated.View>['layout'];
  accessibilityLabel?: string;
};

/** Superfície arredondada; pressable (spring) quando recebe onPress; aceita entering/layout. */
export const Card = ({ children, onPress, accent, flush, style, entering, layout, accessibilityLabel }: CardProps) => {
  const press = usePressScale(0.98);
  const base = [styles.card, flush ? null : styles.padded, accent ? { borderColor: withAlpha(accent, 0.6) } : null];
  if (!onPress) {
    return (
      <Animated.View entering={entering} layout={layout} style={[base, style]}>
        {children}
      </Animated.View>
    );
  }
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      entering={entering}
      layout={layout}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[base, press.style, style]}
    >
      {children}
    </AnimatedPressable>
  );
};

export type ChipProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Cor de destaque (texto/borda; fundo quando selected). */
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Pílula pequena de informação; selecionável/pressable se receber onPress. */
export const Chip = ({ label, icon, color = colors.muted, selected = false, onPress, style }: ChipProps) => {
  const press = usePressScale(0.96);
  const fg = selected ? colors.onAccent : color === colors.muted ? colors.text : color;
  const body = (
    <>
      {icon ? <Ionicons name={icon} size={13} color={fg} /> : null}
      <Text variant="caption" color={fg} style={styles.chipText}>
        {label}
      </Text>
    </>
  );
  const chipStyle = [
    styles.chip,
    { backgroundColor: selected ? color : withAlpha(color, 0.14), borderColor: withAlpha(color, selected ? 1 : 0.3) },
  ];
  if (!onPress) return <View style={[chipStyle, style]}>{body}</View>;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[chipStyle, press.style, style]}
    >
      {body}
    </AnimatedPressable>
  );
};

export type DividerProps = { style?: StyleProp<ViewStyle>; vertical?: boolean };

/** Linha fina separadora. */
export const Divider = ({ style, vertical }: DividerProps) => (
  <View style={[vertical ? styles.dividerV : styles.dividerH, style]} />
);

export type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

/** Estado vazio com ícone, texto e ação opcional. */
export const EmptyState = ({ icon = 'barbell-outline', title, message, action, style }: EmptyStateProps) => {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.accent} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color={colors.muted} align="center">
          {message}
        </Text>
      ) : null}
      {action ? <Button fullWidth={false} onPress={action.onPress}>{action.label}</Button> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  padded: { padding: spacing.md, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipText: { fontFamily: 'Inter_600SemiBold' },
  dividerH: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, alignSelf: 'stretch' },
  dividerV: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line, alignSelf: 'stretch' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.12),
    marginBottom: spacing.xs,
  },
});

import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MovementKey, MovementOption } from '../domain/models';
import { fonts, movementColors, radius, withAlpha } from '../theme';
import { Text } from './Text';

export type MovementBadgeProps = {
  group: MovementKey;
  /** Número de reps exibido no centro. */
  reps: number;
  /** Lado do quadrado (padrão 40). */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Quadrado com a cor do movimento e as reps no centro. */
export const MovementBadge = ({ group, reps, size = 40, style }: MovementBadgeProps) => {
  const color = movementColors[group];
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: withAlpha(color, 0.16), borderColor: withAlpha(color, 0.5) }, style]}>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: size * 0.55, lineHeight: size * 0.62, color }}>{reps}</Text>
    </View>
  );
};

export type MovementPillProps = {
  movement: Pick<MovementOption, 'group' | 'label' | 'reps'>;
  /** Oculta o número de reps. */
  hideReps?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pílula colorida "5 Barra fixa". */
export const MovementPill = ({ movement, hideReps, style }: MovementPillProps) => {
  const color = movementColors[movement.group];
  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(color, 0.14), borderColor: withAlpha(color, 0.4) }, style]}>
      {hideReps ? null : <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 22, color }}>{movement.reps}</Text>}
      <Text variant="body" style={{ fontFamily: fonts.bodySemibold, fontSize: 14 }}>{movement.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});

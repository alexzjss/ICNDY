import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { haptic, Stepper, Text } from '../../components';
import { MovementOption, PartialProgress } from '../../domain/models';
import { additionalRepsFromPartial } from '../../domain/scoring';
import { colors, fonts, movementColors, radius, withAlpha } from '../../theme';

export type PartialPickerProps = {
  movements: MovementOption[];
  value: PartialProgress;
  onChange: (value: PartialProgress) => void;
};

/** Onde você parou no round incompleto: toque no movimento e ajuste as reps. */
export const PartialPicker = ({ movements, value, onChange }: PartialPickerProps) => {
  const reduced = useReducedMotion();
  const additional = additionalRepsFromPartial(movements, value);
  return (
    <View style={styles.wrap}>
      {movements.map((movement, index) => {
        const color = movementColors[movement.group];
        const selected = index === value.movementIndex;
        const done = index < value.movementIndex;
        return (
          <Animated.View key={`${movement.key}-${index}`} layout={reduced ? undefined : LinearTransition.springify().damping(18)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Parei em ${movement.label}`}
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) {
                  haptic.select();
                  onChange({ movementIndex: index, reps: 0 });
                }
              }}
              style={[
                styles.card,
                { backgroundColor: withAlpha(color, selected ? 0.18 : 0.07), borderColor: withAlpha(color, selected ? 0.9 : 0.25), opacity: selected || done ? 1 : 0.6 },
              ]}
            >
              <View style={styles.row}>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 32, color }}>{movement.reps}</Text>
                <Text variant="body" style={styles.name}>{movement.label}</Text>
                {done ? <Ionicons name="checkmark-circle" size={22} color={color} /> : null}
                {selected ? <Text variant="label" color={color}>Parei aqui</Text> : null}
              </View>
              {selected ? (
                <Stepper
                  value={value.reps}
                  min={0}
                  max={Math.max(0, movement.reps - 1)}
                  color={color}
                  valueSize={38}
                  unit={`de ${movement.reps} reps`}
                  onChange={(reps) => onChange({ movementIndex: index, reps })}
                />
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
      <Text variant="caption" align="center">
        Reps adicionais: <Text variant="caption" color={colors.text} style={{ fontFamily: fonts.bodyBold }}>{additional}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { borderRadius: radius.lg, borderWidth: 1.5, padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontFamily: fonts.bodySemibold },
});

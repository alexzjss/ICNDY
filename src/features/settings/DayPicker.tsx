import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING, haptic } from '../../components';
import { colors, fonts } from '../../theme';
import { WEEKDAY_LETTERS, WEEKDAY_NAMES } from '../home/logic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Day = ({ index, on, onToggle }: { index: number; on: boolean; onToggle: () => void }) => {
  const reduced = useReducedMotion();
  const p = useSharedValue(on ? 1 : 0);
  const press = useSharedValue(1);
  useEffect(() => {
    p.value = reduced ? (on ? 1 : 0) : withSpring(on ? 1 : 0, { damping: 14, stiffness: 240 });
  }, [on, reduced, p]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.surfaceRaised, colors.accent]),
    transform: [{ scale: press.value * (1 + p.value * 0.08) }],
  }));
  const label = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [colors.muted, colors.onAccent]) }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={WEEKDAY_NAMES[index]}
      accessibilityState={{ selected: on }}
      onPressIn={() => {
        press.value = reduced ? 1 : withSpring(0.88, SPRING);
      }}
      onPressOut={() => {
        press.value = reduced ? 1 : withSpring(1, SPRING);
      }}
      onPress={() => {
        haptic.select();
        onToggle();
      }}
      style={[styles.day, style]}
    >
      <Animated.Text style={[styles.letter, label]}>{WEEKDAY_LETTERS[index]}</Animated.Text>
    </AnimatedPressable>
  );
};

type Props = { value: number[]; onChange: (days: number[]) => void };

/** 7 chips animados (D S T Q Q S S) para escolher os dias de treino. */
export const DayPicker = ({ value, onChange }: Props) => (
  <View style={styles.row}>
    {WEEKDAY_LETTERS.map((_, index) => (
      <Day
        key={index}
        index={index}
        on={value.includes(index)}
        onToggle={() => onChange(value.includes(index) ? value.filter((d) => d !== index) : [...value, index].sort())}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24 },
});

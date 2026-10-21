import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { haptic, Text, usePressScale } from '../../components';
import { colors, fonts, radius, withAlpha } from '../../theme';
import { RPE_COLORS, RPE_LABELS } from './format';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Cell = ({ n, selected, onPress }: { n: number; selected: boolean; onPress: () => void }) => {
  const press = usePressScale(0.9);
  const tint = RPE_COLORS[n - 1];
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`RPE ${n}, ${RPE_LABELS[n]}`}
      accessibilityState={{ selected }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[
        styles.cell,
        { backgroundColor: selected ? tint : withAlpha(tint, 0.14), borderColor: withAlpha(tint, selected ? 1 : 0.4) },
        press.style,
      ]}
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: selected ? colors.onAccent : tint }}>{n}</Text>
    </AnimatedPressable>
  );
};

export type RpePickerProps = {
  value?: number;
  onChange: (value: number | undefined) => void;
};

/** Seletor de esforço percebido 1-10 (verde -> vermelho). Tocar de novo limpa. */
export const RpePicker = ({ value, onChange }: RpePickerProps) => (
  <View style={styles.wrap}>
    <View style={styles.grid}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <Cell key={n} n={n} selected={value === n} onPress={() => onChange(value === n ? undefined : n)} />
      ))}
    </View>
    <Text variant="caption" color={value ? RPE_COLORS[value - 1] : colors.muted} align="center" style={styles.label}>
      {value ? `${value} · ${RPE_LABELS[value]}` : 'Leve … Máximo · toque para escolher'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '18%', flexGrow: 1, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodySemibold, fontSize: 14 },
});

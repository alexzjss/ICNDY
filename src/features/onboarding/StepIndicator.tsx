import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme';

const Segment = ({ state }: { state: 'done' | 'current' | 'todo' }) => {
  const reduced = useReducedMotion();
  const target = state === 'current' ? 1 : state === 'done' ? 0.5 : 0;
  const p = useSharedValue(target);
  useEffect(() => {
    p.value = reduced ? target : withSpring(target, { damping: 26, stiffness: 240 });
  }, [target, reduced, p]);
  const style = useAnimatedStyle(() => ({
    flexGrow: 1 + p.value * 1.5,
    backgroundColor: interpolateColor(p.value, [0, 0.5, 1], [colors.line, colors.accentAlt, colors.accent]),
  }));
  return <Animated.View style={[styles.seg, style]} />;
};

/** Indicador de progresso em segmentos. */
export const StepIndicator = ({ step, total }: { step: number; total: number }) => (
  <View style={styles.row} accessible accessibilityLabel={`Passo ${step + 1} de ${total}`}>
    {Array.from({ length: total }, (_, i) => (
      <Segment key={i} state={i < step ? 'done' : i === step ? 'current' : 'todo'} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, height: 6 },
  seg: { flexBasis: 0, height: 6, borderRadius: 3 },
});

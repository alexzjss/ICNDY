import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { fonts, movementColors, roundColor } from '../../theme';

const LETTERS = ['I', 'C', 'N', 'D', 'Y'];

const Letter = ({ char, index }: { char: string; index: number }) => {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    float.value = withDelay(900 + index * 160, withRepeat(withSequence(withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1));
  }, [reduced, index, float]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(150 + index * 110).springify().damping(10).stiffness(160)}>
      <Animated.Text style={[styles.letter, { color: roundColor(index) }, style]}>{char}</Animated.Text>
    </Animated.View>
  );
};

const Bar = ({ color, index }: { color: string; index: number }) => {
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) w.value = withDelay(700 + index * 150, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [reduced, index, w]);
  const style = useAnimatedStyle(() => ({ flex: w.value, opacity: w.value }));
  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
};

/** Logotipo ICNDY animado + faixa com as três cores dos movimentos. */
export const Wordmark = () => (
  <View style={styles.root} accessible accessibilityLabel="ICNDY">
    <View style={styles.letters}>
      {LETTERS.map((char, index) => (
        <Letter key={char} char={char} index={index} />
      ))}
    </View>
    <View style={styles.bars}>
      {[movementColors.pull, movementColors.push, movementColors.squat].map((color, index) => (
        <Bar key={color} color={color} index={index} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 10 },
  letters: { flexDirection: 'row', gap: 4 },
  letter: { fontFamily: fonts.displayBold, fontSize: 104, lineHeight: 112, letterSpacing: 2 },
  bars: { flexDirection: 'row', width: 220, height: 8, gap: 6 },
  bar: { height: 8, borderRadius: 4 },
});

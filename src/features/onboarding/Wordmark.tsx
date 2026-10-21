import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fonts, movementColors, roundColor } from '../../theme';

const LETTERS = ['I', 'C', 'N', 'D', 'Y'];

const Letter = ({ char, index }: { char: string; index: number }) => {
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(index * 50).duration(250)}>
      <Animated.Text style={[styles.letter, { color: roundColor(index) }]}>{char}</Animated.Text>
    </Animated.View>
  );
};

const Bar = ({ color, index }: { color: string; index: number }) => {
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) w.value = withDelay(150 + index * 60, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
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

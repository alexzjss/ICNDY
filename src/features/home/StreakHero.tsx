import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedNumber, Card, SPRING, Text } from '../../components';
import { colors, withAlpha } from '../../theme';

type Props = { streak: number };

/** Streak atual grande com chama pulsante. */
export const StreakHero = ({ streak }: Props) => {
  const reduced = useReducedMotion();
  const alive = streak > 0;
  const pop = useSharedValue(reduced ? 1 : 0);
  const flicker = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    pop.value = withDelay(250, withSpring(1, SPRING));
    if (!alive) return;
    flicker.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1);
  }, [reduced, alive, pop, flicker]);

  const flame = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value * (1 + flicker.value * 0.1) }, { rotate: `${(flicker.value - 0.5) * 6}deg` }],
  }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + flicker.value * 0.35, transform: [{ scale: 1 + flicker.value * 0.15 }] }));

  const tint = alive ? colors.accent : colors.muted;
  return (
    <Card accent={alive ? colors.accent : undefined} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flameWrap}>
          {alive ? <Animated.View style={[styles.glow, { backgroundColor: withAlpha(colors.accent, 0.5) }, glow]} /> : null}
          <Animated.View style={flame}>
            <Ionicons name={alive ? 'flame' : 'flame-outline'} size={64} color={tint} />
          </Animated.View>
        </View>
        <View style={styles.text}>
          <Text variant="label">Sequência atual</Text>
          <AnimatedNumber value={streak} fontSize={88} color={alive ? colors.text : colors.muted} duration={1100} />
          <Text variant="caption">{streak === 1 ? 'dia planejado seguido' : 'dias planejados seguidos'}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { paddingVertical: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  flameWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 70, height: 70, borderRadius: 35 },
  text: { flex: 1 },
});

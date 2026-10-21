import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedNumber, Card, Text } from '../../components';
import { colors, withAlpha } from '../../theme';

type Props = { streak: number };

/** Streak atual grande com chama estática com fade curto. */
export const StreakHero = ({ streak }: Props) => {
  const reduced = useReducedMotion();
  const alive = streak > 0;
  const pop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    pop.value = withDelay(100, withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }));
  }, [reduced, pop]);

  const flame = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + pop.value * 0.1 }], opacity: pop.value,
  }));

  const tint = alive ? colors.accent : colors.muted;
  return (
    <Card accent={alive ? colors.accent : undefined} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.flameWrap}>
          {alive ? <View style={[styles.glow, { backgroundColor: withAlpha(colors.accent, 0.2) }]} /> : null}
          <Animated.View style={flame}>
            <Ionicons name={alive ? 'flame' : 'flame-outline'} size={64} color={tint} />
          </Animated.View>
        </View>
        <View style={styles.text}>
          <Text variant="label">Sequência atual</Text>
          <AnimatedNumber value={streak} fontSize={88} color={alive ? colors.text : colors.muted} duration={600} />
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

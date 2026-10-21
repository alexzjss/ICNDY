import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Button, Card, Text } from '../../components';
import { WorkoutSession } from '../../domain/models';
import { sessionTitle } from '../../domain/presets';
import { colors } from '../../theme';

/** Destaque para retomar o treino em andamento. */
export const ActiveWorkoutCard = ({ session, entering }: { session: WorkoutSession; entering?: React.ComponentProps<typeof Card>['entering'] }) => {
  const router = useRouter();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1);
  }, [reduced, pulse]);
  const dot = useAnimatedStyle(() => ({ opacity: 0.4 + pulse.value * 0.6, transform: [{ scale: 0.85 + pulse.value * 0.3 }] }));
  return (
    <Card accent={colors.accent} entering={entering}>
      <View style={styles.head}>
        <Animated.View style={[styles.dot, dot]} />
        <Text variant="label" color={colors.accent}>{session.status === 'paused' ? 'Treino pausado' : 'Treino em andamento'}</Text>
      </View>
      <Text variant="heading">{sessionTitle(session)}</Text>
      <Button icon="play" onPress={() => router.push('/workout/active')}>Retomar treino</Button>
    </Card>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});

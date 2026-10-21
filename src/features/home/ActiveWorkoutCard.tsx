import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Text } from '../../components';
import { WorkoutSession } from '../../domain/models';
import { sessionTitle } from '../../domain/presets';
import { colors } from '../../theme';

/** Destaque para retomar o treino em andamento. */
export const ActiveWorkoutCard = ({ session, entering }: { session: WorkoutSession; entering?: React.ComponentProps<typeof Card>['entering'] }) => {
  const router = useRouter();
  return (
    <Card accent={colors.accent} entering={entering}>
      <View style={styles.head}>
        <View style={styles.dot} />
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

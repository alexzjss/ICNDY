import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDayMonth } from '../domain/dates';
import { WorkoutSession } from '../domain/models';
import { sessionTitle } from '../domain/presets';
import { colors, fonts, movementColors } from '../theme';
import { Card, Chip } from './Card';
import { Text } from './Text';

export type SessionCardProps = {
  session: WorkoutSession;
  /** Substitui a navegação padrão para /session/[id]. */
  onPress?: () => void;
  /** Animação de entrada (ex. staggerEntering(i)). */
  entering?: React.ComponentProps<typeof Card>['entering'];
};

/** Card de treino: data, título, score "R + reps" grande, chips RPE/duração e faixa dos 3 movimentos. */
export const SessionCard = ({ session, onPress, entering }: SessionCardProps) => {
  const router = useRouter();
  const minutes = Math.round(session.durationSeconds / 60);
  return (
    <Card
      flush
      entering={entering}
      accessibilityLabel={`${sessionTitle(session)}, ${session.completedRounds} rounds mais ${session.additionalReps} repetições`}
      onPress={onPress ?? (() => router.push({ pathname: '/session/[id]', params: { id: session.id } }))}
    >
      <View style={styles.body}>
        <View style={styles.left}>
          <Text variant="label">{formatDayMonth(session.localDate)}</Text>
          <Text variant="heading" numberOfLines={1}>{sessionTitle(session)}</Text>
          <View style={styles.chips}>
            <Chip icon="time-outline" label={`${minutes} min`} />
            {session.rpe ? <Chip icon="flame-outline" label={`RPE ${session.rpe}`} color={colors.accent} /> : null}
          </View>
        </View>
        <View style={styles.score}>
          <Text style={styles.rounds}>{session.completedRounds}</Text>
          <Text style={styles.extra}>+ {session.additionalReps}</Text>
        </View>
      </View>
      <View style={styles.stripe}>
        {session.movements.map((movement, index) => (
          <View key={`${movement.key}-${index}`} style={{ flex: 1, backgroundColor: movementColors[movement.group] }} />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  left: { flex: 1, gap: 4 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 4 },
  score: { alignItems: 'flex-end' },
  rounds: { fontFamily: fonts.displayBold, fontSize: 52, lineHeight: 54, color: colors.text, fontVariant: ['tabular-nums'] },
  extra: { fontFamily: fonts.display, fontSize: 22, lineHeight: 24, color: colors.muted, fontVariant: ['tabular-nums'] },
  stripe: { flexDirection: 'row', height: 5 },
});

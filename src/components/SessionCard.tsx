import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WorkoutSession } from '../domain/models';
import { formatScore } from '../domain/scoring';
import { sessionTitle } from '../domain/presets';
import { colors } from '../theme';
export const SessionCard = ({ session, onPress }: { session: WorkoutSession; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.row}><Text style={styles.date}>{new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text><Text style={styles.score}>{formatScore(session.completedRounds, session.additionalReps)}</Text></View>
    <Text style={styles.name}>{sessionTitle(session)}</Text>
    <Text style={styles.meta}>{Math.round(session.durationSeconds / 60)} min · {session.movements.map((movement) => movement.label).join(' · ')}</Text>
  </Pressable>
);
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.line }, row: { flexDirection: 'row', justifyContent: 'space-between' }, date: { color: colors.muted, fontWeight: '700' }, score: { color: colors.lime, fontSize: 24, fontWeight: '900' }, name: { color: colors.text, fontSize: 17, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 12 } });

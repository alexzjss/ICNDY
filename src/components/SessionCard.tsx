import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WorkoutSession } from '../domain/models';
import { formatScore } from '../domain/scoring';
import { formatLocalDate } from '../domain/dates';
import { colors } from '../theme';
export const SessionCard = ({ session, onPress }: { session: WorkoutSession; onPress?: () => void }) => (
  <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${session.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy'} session`} accessibilityHint={onPress ? 'Double tap to view session details' : undefined} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.row}><Text style={styles.date}>{formatLocalDate(session.localDate)}</Text><Text style={styles.score}>{formatScore(session.completedRounds, session.additionalReps)}</Text></View>
    <Text style={styles.name}>{session.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy'}</Text>
    <Text style={styles.meta}>{Math.round(session.durationSeconds / 60)} min · {session.movements.map((movement) => movement.label).join(' · ')}</Text>
  </Pressable>
);
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.line }, pressed: { opacity: 0.72, borderColor: colors.lime }, row: { flexDirection: 'row', justifyContent: 'space-between' }, date: { color: colors.muted, fontWeight: '700' }, score: { color: colors.lime, fontSize: 24, fontWeight: '900' }, name: { color: colors.text, fontSize: 17, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 12 } });

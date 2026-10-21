import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Label, Screen, Title } from '../../components/ui';
import { SessionCard } from '../../components/SessionCard';
import { useApp } from '../../context/AppContext';
import { getAchievements } from '../../domain/achievements';
import { localDateString } from '../../domain/dates';
import { calculateStreaks } from '../../domain/streaks';
import { colors } from '../../theme';

export default function ProgressScreen() {
  const router = useRouter();
  const { sessions, schedule } = useApp();
  const streaks = calculateStreaks(sessions, schedule, localDateString());
  const achievements = getAchievements(sessions, streaks.best);
  const groups = sessions.reduce<Record<string, typeof sessions>>((all, session) => ({ ...all, [session.comparisonKey]: [...(all[session.comparisonKey] ?? []), session] }), {});
  const best = Math.max(0, ...sessions.map((session) => session.totalReps));
  return (
    <Screen>
      <Label>Progresso</Label>
      <Title>Sua evolução.</Title>
      <Card>
        <View style={styles.row}>
          <View><Label>Treinos</Label><Text style={styles.metric}>{sessions.length}</Text></View>
          <View><Label>Melhor sequência</Label><Text style={styles.metric}>{streaks.best}</Text></View>
          <View><Label>Melhor total</Label><Text style={styles.metric}>{best}</Text></View>
        </View>
      </Card>
      <Label>Conquistas</Label>
      {achievements.map((achievement) => (
        <Card key={achievement.id}>
          <Text style={[styles.name, !achievement.earned && styles.locked]}>{achievement.label}</Text>
          <Text style={styles.meta}>{achievement.detail}</Text>
        </Card>
      ))}
      <Label>Configurações usadas: {Object.keys(groups).length}</Label>
      <Label>Histórico</Label>
      {sessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })} />)}
      {sessions.length === 0 && <Card><Text style={styles.meta}>Seus treinos concluídos aparecerão aqui.</Text></Card>}
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 5 },
  name: { color: colors.text, fontWeight: '800', fontSize: 16 },
  locked: { color: colors.muted },
  meta: { color: colors.muted, fontSize: 12 },
});

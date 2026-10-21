import { StyleSheet, View } from 'react-native';
import { AnimatedNumber, Card, EmptyState, Header, Screen, SessionCard, StaggerIn, staggerEntering, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { getAchievements } from '../../domain/achievements';
import { localDateString } from '../../domain/dates';
import { calculateStreaks } from '../../domain/streaks';
import { colors } from '../../theme';

export default function ProgressScreen() {
  const { sessions, schedule } = useApp();
  const streaks = calculateStreaks(sessions, schedule, localDateString());
  const achievements = getAchievements(sessions, streaks.best);
  const best = Math.max(0, ...sessions.map((session) => session.totalReps));
  return (
    <Screen tabs>
      <Header eyebrow="Progresso" title="Sua evolução." />
      <StaggerIn index={1}>
        <Card>
          <View style={styles.row}>
            <View><Text variant="label">Treinos</Text><AnimatedNumber value={sessions.length} fontSize={40} /></View>
            <View><Text variant="label">Melhor sequência</Text><AnimatedNumber value={streaks.best} fontSize={40} /></View>
            <View><Text variant="label">Melhor total</Text><AnimatedNumber value={best} fontSize={40} /></View>
          </View>
        </Card>
      </StaggerIn>
      <Text variant="label">Conquistas</Text>
      {achievements.map((achievement, index) => (
        <Card key={achievement.id} entering={staggerEntering(index + 2)}>
          <Text variant="heading" color={achievement.earned ? colors.text : colors.muted}>{achievement.label}</Text>
          <Text variant="caption">{achievement.detail}</Text>
        </Card>
      ))}
      <Text variant="label">Histórico</Text>
      {sessions.map((session, index) => <SessionCard key={session.id} session={session} entering={staggerEntering(index)} />)}
      {sessions.length === 0 ? <EmptyState icon="time-outline" title="Sem histórico" message="Seus treinos concluídos aparecerão aqui." /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between' } });

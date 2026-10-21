import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedNumber, Card, EmptyState, Header, Screen, StaggerIn, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { getAchievements } from '../../domain/achievements';
import { localDateString } from '../../domain/dates';
import { findPersonalBest } from '../../domain/pace';
import { calculateStreaks } from '../../domain/streaks';
import { pickPrimaryKey } from '../../features/home/logic';
import { AchievementList } from '../../features/progress/AchievementList';
import { ConsistencyHeatmap } from '../../features/progress/ConsistencyHeatmap';
import { EvolutionChart } from '../../features/progress/EvolutionChart';
import { History } from '../../features/progress/History';
import { colors } from '../../theme';

const Metric = ({ label, value, suffix }: { label: string; value: number; suffix?: string }) => (
  <View style={styles.metric}>
    <Text variant="label">{label}</Text>
    <AnimatedNumber value={value} fontSize={44} suffix={suffix} duration={1000} />
  </View>
);

export default function ProgressScreen() {
  const { sessions, schedule } = useApp();
  const today = localDateString();
  const streaks = useMemo(() => calculateStreaks(sessions, schedule, today), [sessions, schedule, today]);
  const achievements = useMemo(() => getAchievements(sessions, streaks.best), [sessions, streaks.best]);
  const prKey = useMemo(() => pickPrimaryKey(sessions), [sessions]);
  const pr = prKey ? findPersonalBest(sessions, prKey)?.totalReps ?? 0 : 0;

  return (
    <Screen tabs>
      <Header eyebrow="Progresso" title="Sua evolução" />
      <StaggerIn index={1}>
        <Card>
          <View style={styles.row}>
            <Metric label="Treinos" value={sessions.length} />
            <Metric label="Melhor sequência" value={streaks.best} />
            <Metric label="PR (reps)" value={pr} />
          </View>
        </Card>
      </StaggerIn>
      {sessions.length === 0 ? (
        <StaggerIn index={2}>
          <EmptyState icon="stats-chart-outline" title="Sem dados ainda" message="Complete seu primeiro treino e acompanhe a evolução, a consistência e as conquistas aqui." />
        </StaggerIn>
      ) : (
        <>
          <StaggerIn index={2}>
            <Card>
              <Text variant="label">Evolução</Text>
              <EvolutionChart sessions={sessions} />
            </Card>
          </StaggerIn>
          <StaggerIn index={3}>
            <Card>
              <Text variant="label">Consistência · 16 semanas</Text>
              <ConsistencyHeatmap sessions={sessions} schedule={schedule} today={today} />
            </Card>
          </StaggerIn>
        </>
      )}
      <View style={styles.section}>
        <Text variant="label">Conquistas · {achievements.filter((a) => a.earned).length}/{achievements.length}</Text>
        <AchievementList items={achievements} />
      </View>
      {sessions.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" color={colors.text}>Histórico</Text>
          <History sessions={sessions} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { gap: 2 },
  section: { gap: 10, marginTop: 8 },
});

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedNumber, Card, EmptyState, Header, Screen, StaggerIn, Text, staggerEntering } from '../../components';
import { useApp } from '../../context/AppContext';
import { getAchievements } from '../../domain/achievements';
import { localDateString } from '../../domain/dates';
import { getInsights } from '../../domain/insights';
import { findPersonalBest } from '../../domain/pace';
import { calculateStreaks } from '../../domain/streaks';
import { pickPrimaryKey } from '../../features/home/logic';
import { AchievementList } from '../../features/progress/AchievementList';
import { ConsistencyHeatmap } from '../../features/progress/ConsistencyHeatmap';
import { EvolutionChart } from '../../features/progress/EvolutionChart';
import { History } from '../../features/progress/History';
import { VolumeCard } from '../../features/volume/VolumeCard';
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
  const insights = useMemo(() => getInsights(sessions), [sessions]);
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
      {sessions.length > 0 ? (
        <StaggerIn index={2}>
          <Card>
            <Text variant="label">Insights</Text>
            <View style={styles.insights}>
              {insights.map((insight, index) => (
                <Animated.View key={insight.title} entering={staggerEntering(index + 3)} style={styles.insight}>
                  <Ionicons name={insight.icon} size={20} color={colors.accent} style={styles.insightIcon} />
                  <View style={styles.insightText}>
                    <Text variant="body" style={styles.insightTitle}>{insight.title}</Text>
                    <Text variant="caption">{insight.detail}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Card>
        </StaggerIn>
      ) : null}
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
          <StaggerIn index={4}>
            <VolumeCard sessions={sessions} />
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
  insights: { gap: 14, marginTop: 12 },
  insight: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightIcon: { marginTop: 2 },
  insightTitle: { fontWeight: '600' },
  insightText: { flex: 1, gap: 2 },
  section: { gap: 10, marginTop: 8 },
});

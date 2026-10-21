import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState, Header, IconButton, Screen, SessionCard, StaggerIn, staggerEntering, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { formatDayMonth, localDateString } from '../../domain/dates';
import { findPersonalBest } from '../../domain/pace';
import { calculateStreaks } from '../../domain/streaks';
import { ActiveWorkoutCard } from '../../features/home/ActiveWorkoutCard';
import { currentWeek, greetingFor, pickPrimaryKey, recentResults } from '../../features/home/logic';
import { PrCard } from '../../features/home/PrCard';
import { StreakHero } from '../../features/home/StreakHero';
import { WeekStrip } from '../../features/home/WeekStrip';

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, active, schedule } = useApp();
  const today = localDateString();
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);
  const streak = useMemo(() => calculateStreaks(sessions, schedule, today).current, [sessions, schedule, today]);
  const week = useMemo(() => currentWeek(today, sessions, schedule), [today, sessions, schedule]);
  const last = useMemo(() => [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0], [sessions]);
  const primaryKey = useMemo(() => pickPrimaryKey(sessions), [sessions]);
  const pr = useMemo(() => (primaryKey ? findPersonalBest(sessions, primaryKey) : undefined), [sessions, primaryKey]);
  const results = useMemo(() => (primaryKey ? recentResults(sessions, primaryKey) : []), [sessions, primaryKey]);

  let index = 1;
  return (
    <Screen tabs>
      <Header
        eyebrow={formatDayMonth(today)}
        title={greeting}
        right={<IconButton icon="settings-outline" variant="solid" accessibilityLabel="Ajustes" onPress={() => router.push('/settings')} />}
      />
      {active ? <ActiveWorkoutCard session={active} entering={staggerEntering(index++)} /> : null}
      <StaggerIn index={index++}>
        <StreakHero streak={streak} />
      </StaggerIn>
      <StaggerIn index={index++}>
        <WeekStrip week={week} />
      </StaggerIn>
      {last ? (
        <View style={styles.section}>
          <Text variant="label">Último treino</Text>
          <SessionCard session={last} entering={staggerEntering(index++)} />
        </View>
      ) : (
        <StaggerIn index={index++}>
          <EmptyState
            icon="rocket-outline"
            title="Seu primeiro Cindy te espera"
            message="20 minutos, 3 movimentos, quantos rounds você aguenta? Toque em TREINAR e comece sua sequência."
            action={{ label: 'Treinar agora', onPress: () => router.push('/workout/setup') }}
          />
        </StaggerIn>
      )}
      {pr ? <PrCard pr={pr} results={results} entering={staggerEntering(index++)} /> : null}
      <Text variant="caption" style={styles.disclaimer}>
        O treino é de sua responsabilidade. O ICNDY é uma ferramenta de registro, não aconselhamento médico. Pare se algum exercício causar dor ou sintomas preocupantes.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  disclaimer: { opacity: 0.7, marginTop: 8 },
});

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedNumber, Button, Card, EmptyState, Header, IconButton, Screen, SessionCard, StaggerIn, staggerEntering, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { addDays, localDateString } from '../../domain/dates';
import { sessionTitle } from '../../domain/presets';
import { calculateStreaks } from '../../domain/streaks';
import { colors } from '../../theme';

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, active, schedule } = useApp();
  const streak = useMemo(() => calculateStreaks(sessions, schedule, localDateString()).current, [sessions, schedule]);
  const weekStart = addDays(localDateString(), -6);
  const week = sessions.filter((session) => session.localDate >= weekStart).length;
  return (
    <Screen tabs>
      <Header
        eyebrow="ICNDY"
        title="Faça hoje valer."
        right={<IconButton icon="settings-outline" variant="solid" accessibilityLabel="Ajustes" onPress={() => router.push('/settings')} />}
      />
      <StaggerIn index={1}>
        <Card>
          <View style={styles.metrics}>
            <View>
              <Text variant="label">Sequência atual</Text>
              <View style={styles.inline}>
                <AnimatedNumber value={streak} fontSize={48} />
                <Text variant="caption"> dias</Text>
              </View>
            </View>
            <View>
              <Text variant="label">Últimos 7 dias</Text>
              <View style={styles.inline}>
                <AnimatedNumber value={week} fontSize={48} />
                <Text variant="caption"> treinos</Text>
              </View>
            </View>
          </View>
        </Card>
      </StaggerIn>
      {active ? (
        <StaggerIn index={2}>
          <Card accent={colors.accent}>
            <Text variant="label" color={colors.accent}>Treino em andamento</Text>
            <Text variant="heading">{sessionTitle(active)}</Text>
            <Button icon="play" onPress={() => router.push('/workout/active')}>Retomar treino</Button>
          </Card>
        </StaggerIn>
      ) : null}
      <View style={styles.section}>
        <Text variant="label">Treinos recentes</Text>
        {sessions.slice(0, 3).map((session, index) => (
          <SessionCard key={session.id} session={session} entering={staggerEntering(index + 3)} />
        ))}
        {sessions.length === 0 ? <EmptyState title="Nenhum treino ainda" message="Seu primeiro benchmark começa aqui. Toque em TREINAR." /> : null}
      </View>
      <Text variant="caption">O treino é de sua responsabilidade. O ICNDY é uma ferramenta de registro, não aconselhamento médico. Pare se algum exercício causar dor ou sintomas preocupantes.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'baseline' },
  section: { gap: 12 },
});

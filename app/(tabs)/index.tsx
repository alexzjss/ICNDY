import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRootNavigationState, useRouter } from "expo-router";
import { Button, Card, Label, Screen, Title } from '../../src/components/ui';
import { SessionCard } from '../../src/components/SessionCard';
import { useApp } from '../../src/context/AppContext';
import { calculateStreaks } from '../../src/domain/streaks';
import { colors } from '../../src/theme';
export default function HomeScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { sessions, active, settings, schedule, isInitialized } = useApp();
  const [streak, setStreak] = useState(0);
  useEffect(() => { setStreak(calculateStreaks(sessions, schedule, new Date().toISOString().slice(0, 10)).current); }, [sessions, schedule]);
  useEffect(() => {
    if (
      isInitialized &&
      Boolean(navigationState?.key) &&
      !settings.onboardingComplete
    ) {
      router.replace("/onboarding");
    }
  }, [
    isInitialized,
    navigationState?.key,
    router,
    settings.onboardingComplete,
  ]);
  return <Screen><View style={styles.header}><View><Label>ICNDY / TRAINING LOG</Label><Title>Make today count.</Title></View><Text style={styles.mark}>IC</Text></View>
    <Card><View style={styles.metricRow}><View><Label>Current streak</Label><Text style={styles.metric}>{streak}<Text style={styles.unit}> days</Text></Text></View><View><Label>This week</Label><Text style={styles.metric}>{sessions.filter((session) => session.localDate >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)).length}<Text style={styles.unit}> sessions</Text></Text></View></View></Card>
    {active ? <Card><Label>Workout in progress</Label><Title size={22}>{active.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy'}</Title><Button onPress={() => router.push('/workout/active')}>Resume workout</Button></Card> : <Button onPress={() => router.push('/workout/setup')}>Start a workout</Button>}
    <View style={styles.section}><Label>Recent sessions</Label>{sessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} />)}{sessions.length === 0 && <Card><Text style={styles.empty}>No sessions yet. Your first benchmark starts here.</Text></Card>}</View>
    <Text style={styles.notice}>Training is your responsibility. ICNDY is a tracking tool, not medical advice. Stop if an exercise causes pain or concerning symptoms.</Text>
  </Screen>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20 }, mark: { color: colors.lime, fontSize: 28, fontWeight: '900' }, metricRow: { flexDirection: 'row', justifyContent: 'space-between' }, metric: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 5 }, unit: { color: colors.muted, fontSize: 14 }, section: { gap: 12 }, empty: { color: colors.muted, lineHeight: 22 }, notice: { color: colors.muted, fontSize: 11, lineHeight: 17 } });

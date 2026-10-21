import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Label, Screen, Title } from '../../components/ui';
import { SessionCard } from '../../components/SessionCard';
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
  return <Screen><View style={styles.header}><View><Label>ICNDY / TRAINING LOG</Label><Title>Make today count.</Title></View><Pressable accessibilityLabel="Ajustes" onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={26} color={colors.muted} /></Pressable></View>
    <Card><View style={styles.metricRow}><View><Label>Current streak</Label><Text style={styles.metric}>{streak}<Text style={styles.unit}> days</Text></Text></View><View><Label>This week</Label><Text style={styles.metric}>{sessions.filter((session) => session.localDate >= weekStart).length}<Text style={styles.unit}> sessions</Text></Text></View></View></Card>
    {active ? <Card><Label>Workout in progress</Label><Title size={22}>{sessionTitle(active)}</Title><Button onPress={() => router.push('/workout/active')}>Resume workout</Button></Card> : <Button onPress={() => router.push('/workout/setup')}>Start a workout</Button>}
    <View style={styles.section}><Label>Recent sessions</Label>{sessions.slice(0, 3).map((session) => <SessionCard key={session.id} session={session} />)}{sessions.length === 0 && <Card><Text style={styles.empty}>No sessions yet. Your first benchmark starts here.</Text></Card>}</View>
    <Text style={styles.notice}>Training is your responsibility. ICNDY is a tracking tool, not medical advice. Stop if an exercise causes pain or concerning symptoms.</Text>
  </Screen>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20 }, mark: { color: colors.lime, fontSize: 28, fontWeight: '900' }, metricRow: { flexDirection: 'row', justifyContent: 'space-between' }, metric: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 5 }, unit: { color: colors.muted, fontSize: 14 }, section: { gap: 12 }, empty: { color: colors.muted, lineHeight: 22 }, notice: { color: colors.muted, fontSize: 11, lineHeight: 17 } });

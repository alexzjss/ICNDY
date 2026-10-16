import { Alert, Text } from 'react-native';
import { Card, Label, Screen, Title } from '../../src/components/ui';
import { SessionCard } from '../../src/components/SessionCard';
import { useApp } from '../../src/context/AppContext';
import { colors } from '../../src/theme';
export default function HistoryScreen() { const { sessions } = useApp(); return <Screen><Label>EVERY REP COUNTS</Label><Title>History.</Title>{sessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => Alert.alert(session.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy', `${session.completedRounds} rounds + ${session.additionalReps} reps\n${session.notes || 'No notes added.'}`)} />)}{sessions.length === 0 && <Card><Text style={{ color: colors.muted }}>Your completed workouts will appear here.</Text></Card>}</Screen>; }

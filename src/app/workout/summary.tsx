import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Label, Screen, Title } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { repsPerRound, totalReps, validateScore } from '../../domain/scoring';
import { sessionTitle } from '../../domain/presets';
import { colors } from '../../theme';
export default function SummaryScreen() {
  const router = useRouter(); const { active, finishSession, discardSession } = useApp(); const [additional, setAdditional] = useState('0'); const [notes, setNotes] = useState('');
  if (!active) return <Screen><Title>No workout to finish</Title></Screen>;
  const save = async () => { const value = Number(additional); try { validateScore(active.completedRounds, value, active); const now = new Date().toISOString(); await finishSession({ ...active, status: 'completed', finishedAt: now, updatedAt: now, additionalReps: value, totalReps: totalReps(active.completedRounds, value, active), notes: notes.trim() || undefined, completionType: active.completionType ?? 'timer-finished' }); router.replace('/(tabs)'); } catch (error) { Alert.alert('Check your score', String(error)); } };
  const discard = () => Alert.alert('Discard workout?', 'This session will not count toward history or streaks.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: async () => { await discardSession(active.id); router.replace('/(tabs)'); } }]);
  return <Screen><Label>FINISHING / {sessionTitle(active).toUpperCase()}</Label><Title>Strong work.</Title><Card><Label>Final score</Label><Text style={styles.score}>{active.completedRounds} + {additional}</Text><Text style={styles.meta}>{repsPerRound(active)} reps per round · {Math.round(active.durationSeconds / 60)} minute format</Text></Card><Label>Additional reps (0–{repsPerRound(active) - 1})</Label><Field value={additional} onChangeText={setAdditional} placeholder="0" /><Label>Notes (optional)</Label><Field value={notes} onChangeText={setNotes} placeholder="How did it feel?" /><Button onPress={save}>Save result</Button><Button secondary danger onPress={discard}>Discard workout</Button></Screen>;
}
const styles = StyleSheet.create({ score: { color: colors.lime, fontSize: 54, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12 } });

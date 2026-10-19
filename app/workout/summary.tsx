import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { repsPerRound, totalReps, validateScore } from '../../src/domain/scoring';
import { deleteSession, saveSession } from '../../src/database/repositories';
import { colors } from '../../src/theme';
export default function SummaryScreen() {
  const router = useRouter(); const { active, refresh } = useApp(); const [additional, setAdditional] = useState('0'); const [notes, setNotes] = useState('');
  if (!active) return <Screen><Title>Nenhum treino para concluir</Title></Screen>;
  const save = async () => { const value = Number(additional); try { validateScore(active.completedRounds, value, active); const now = new Date().toISOString(); await saveSession({ ...active, status: 'completed', finishedAt: now, updatedAt: now, additionalReps: value, totalReps: totalReps(active.completedRounds, value, active), notes: notes.trim() || undefined, completionType: active.completionType ?? 'timer-finished' }); await refresh(); router.replace('/(tabs)'); } catch (error) { Alert.alert('Confira sua pontuação', String(error)); } };
  const discard = () => Alert.alert('Descartar treino?', 'Esta sessão não será incluída no histórico nem na sequência.', [{ text: 'Continuar treino', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: async () => { await deleteSession(active.id); await refresh(); router.replace('/(tabs)'); } }]);
  return <Screen><Label>SESSÃO CONCLUÍDA / {active.presetId === 'classic' ? 'CINDY CLÁSSICA' : 'CINDY INICIANTE'}</Label><Title>Mandou bem.</Title><Card accent><Label>Placar final</Label><Text style={styles.score}>{active.completedRounds} + {additional}</Text><Text style={styles.meta}>{repsPerRound(active)} repetições por volta · treino de {Math.round(active.durationSeconds / 60)} min</Text></Card><Label>Repetições extras (0–{repsPerRound(active) - 1})</Label><Field value={additional} onChangeText={setAdditional} placeholder="0" /><Label>Notas (opcional)</Label><Field value={notes} onChangeText={setNotes} placeholder="Como foi o treino?" keyboardType="default" multiline /><Button onPress={save}>Salvar resultado</Button><Button secondary danger onPress={discard}>Descartar treino</Button></Screen>;
}
const styles = StyleSheet.create({ score: { color: colors.lime, fontSize: 54, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12 } });

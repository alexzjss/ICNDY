import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedNumber, Button, Card, Field, Header, Screen, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { repsPerRound, totalReps, validateScore } from '../../domain/scoring';
import { sessionTitle } from '../../domain/presets';
export default function SummaryScreen() {
  const router = useRouter(); const { active, finishSession, discardSession } = useApp(); const [additional, setAdditional] = useState('0'); const [notes, setNotes] = useState('');
  if (!active) return <Screen><Text variant="title">Nenhum treino para concluir</Text></Screen>;
  const save = async () => { const value = Number(additional); try { validateScore(active.completedRounds, value, active); const now = new Date().toISOString(); await finishSession({ ...active, status: 'completed', finishedAt: now, updatedAt: now, additionalReps: value, totalReps: totalReps(active.completedRounds, value, active), notes: notes.trim() || undefined, completionType: active.completionType ?? 'timer-finished' }); router.replace('/(tabs)'); } catch (error) { Alert.alert('Confira o resultado', String(error)); } };
  const discard = () => Alert.alert('Descartar treino?', 'Esta sessão não contará no histórico nem nas sequências.', [{ text: 'Manter', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: async () => { await discardSession(active.id); router.replace('/(tabs)'); } }]);
  return (
    <Screen>
      <Header eyebrow={`Finalizando / ${sessionTitle(active)}`} title="Bom trabalho." />
      <Card>
        <Text variant="label">Resultado final</Text>
        <AnimatedNumber value={active.completedRounds} fontSize={72} />
        <Text variant="heading">+ {additional}</Text>
        <Text variant="caption">{repsPerRound(active)} reps por round · formato de {Math.round(active.durationSeconds / 60)} minutos</Text>
      </Card>
      <Text variant="label">Repetições adicionais (0–{repsPerRound(active) - 1})</Text>
      <Field numeric value={additional} onChangeText={setAdditional} placeholder="0" />
      <Text variant="label">Notas (opcional)</Text>
      <Field value={notes} onChangeText={setNotes} placeholder="Como foi?" />
      <Button onPress={save}>Salvar resultado</Button>
      <Button variant="danger" onPress={discard}>Descartar treino</Button>
    </Screen>
  );
}

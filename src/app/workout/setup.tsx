import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Header, MovementBadge, Screen, SegmentedControl, Stepper, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { getPreset, MOVEMENTS, repsPerRound } from '../../domain/presets';
import { comparisonKey } from '../../domain/scoring';
import { localDateString } from '../../domain/dates';
export default function SetupScreen() {
  const router = useRouter(); const { saveActive } = useApp(); const [presetId, setPresetId] = useState<'classic' | 'beginner'>('classic'); const preset = getPreset(presetId); const [duration, setDuration] = useState(preset.durationMinutes); const [movements, setMovements] = useState(preset.movements);
  const selectPreset = (id: 'classic' | 'beginner') => { const next = getPreset(id); setPresetId(id); setDuration(next.durationMinutes); setMovements(next.movements); };
  const cycle = (index: number) => { const movement = movements[index]; const options = Object.values(MOVEMENTS).filter((option) => option.group === movement.group); const next = options[(options.findIndex((option) => option.key === movement.key) + 1) % options.length]; setMovements(movements.map((item, itemIndex) => itemIndex === index ? { ...next, reps: movement.reps } : item)); };
  const start = async () => { const now = new Date().toISOString(); const startedAt = new Date(Date.now() + 3000).toISOString(); const session = { id: `session-${Date.now()}`, createdAt: now, startedAt, updatedAt: now, status: 'active' as const, presetId, durationSeconds: duration * 60, movements, completedRounds: 0, additionalReps: 0, totalReps: 0, comparisonKey: comparisonKey({ durationSeconds: duration * 60, movements }), localDate: localDateString(), pausedDurationMs: 0, elapsedBeforePauseMs: 0, roundSplitsMs: [] }; await saveActive(session); router.replace('/workout/active'); };
  return (
    <Screen>
      <Header back eyebrow={`Preparar / ${preset.name}`} title="Do seu jeito." />
      <SegmentedControl
        options={[{ value: 'classic' as const, label: 'Clássico' }, { value: 'beginner' as const, label: 'Iniciante' }]}
        value={presetId}
        onChange={selectPreset}
      />
      <Card>
        <Text variant="label">Duração</Text>
        <Stepper value={duration} onChange={setDuration} min={1} max={60} unit="min" />
      </Card>
      <Card>
        <Text variant="label">Sequência / toque para trocar a variação</Text>
        {movements.map((movement, index) => (
          <Pressable key={movement.group} onPress={() => cycle(index)} style={styles.movement}>
            <MovementBadge group={movement.group} reps={movement.reps} />
            <Text variant="body" style={styles.flex}>{movement.label}</Text>
            <Text variant="label">Trocar</Text>
          </Pressable>
        ))}
        <Text variant="caption">{repsPerRound({ movements })} reps por round · AMRAP</Text>
      </Card>
      <Button size="lg" icon="flash" onPress={start}>Iniciar treino</Button>
    </Screen>
  );
}
const styles = StyleSheet.create({ movement: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }, flex: { flex: 1 } });

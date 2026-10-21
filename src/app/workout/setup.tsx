import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, Header, haptic, Label, MovementBadge, Screen, SegmentedControl, staggerEntering, Stepper, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../domain/dates';
import { MovementOption, WorkoutSession } from '../../domain/models';
import { findPersonalBest } from '../../domain/pace';
import { getPreset, MOVEMENTS, repsPerRound } from '../../domain/presets';
import { comparisonKey } from '../../domain/scoring';
import { fonts, movementColors } from '../../theme';

type PresetId = 'classic' | 'beginner';

const variationsOf = (movement: MovementOption) => {
  const options = Object.values(MOVEMENTS).filter((option) => option.group === movement.group);
  return options.some((option) => option.key === movement.key) ? options : [movement, ...options];
};

export default function SetupScreen() {
  const router = useRouter();
  const { saveActive, sessions } = useApp();
  const [presetId, setPresetId] = useState<PresetId>('classic');
  const preset = getPreset(presetId);
  const [duration, setDuration] = useState(preset.durationMinutes);
  const [movements, setMovements] = useState<MovementOption[]>(preset.movements);
  const [starting, setStarting] = useState(false);

  const selectPreset = (id: PresetId) => {
    const next = getPreset(id);
    setPresetId(id);
    setDuration(next.durationMinutes);
    setMovements(next.movements);
  };

  const cycle = (index: number) => {
    haptic.select();
    setMovements((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        const options = variationsOf(item);
        const next = options[(options.findIndex((option) => option.key === item.key) + 1) % options.length];
        return { ...next, reps: item.reps };
      }),
    );
  };
  const setReps = (index: number, reps: number) => setMovements((current) => current.map((item, i) => (i === index ? { ...item, reps } : item)));

  const key = comparisonKey({ durationSeconds: duration * 60, movements });
  const pr = useMemo(() => findPersonalBest(sessions, key), [sessions, key]);
  const perRound = repsPerRound({ movements });

  const start = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const now = new Date().toISOString();
      const session: WorkoutSession = {
        id: `session-${Date.now()}`,
        createdAt: now,
        startedAt: new Date(Date.now() + 3000).toISOString(),
        updatedAt: now,
        status: 'active',
        presetId,
        durationSeconds: duration * 60,
        movements,
        completedRounds: 0,
        additionalReps: 0,
        totalReps: 0,
        comparisonKey: key,
        localDate: localDateString(),
        pausedDurationMs: 0,
        elapsedBeforePauseMs: 0,
        roundSplitsMs: [],
      };
      await saveActive(session);
      router.replace('/workout/active');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Screen>
      <Header back eyebrow="Preparar" title="Monte seu treino" />
      <View style={styles.block}>
        <SegmentedControl
          options={[
            { value: 'classic' as const, label: 'Clássico' },
            { value: 'beginner' as const, label: 'Iniciante' },
          ]}
          value={presetId}
          onChange={selectPreset}
        />
      </View>

      <Card entering={staggerEntering(1)}>
        <Label>Duração</Label>
        <Stepper value={duration} onChange={setDuration} min={1} max={60} unit="min" />
      </Card>

      {movements.map((movement, index) => {
        const color = movementColors[movement.group];
        return (
          <Card key={movement.group} accent={color} entering={staggerEntering(index + 2)}>
            <View style={styles.row}>
              <MovementBadge group={movement.group} reps={movement.reps} size={48} />
              <View style={styles.flex}>
                <Text style={styles.name} color={color}>{movement.label}</Text>
                <Label>{`Movimento ${index + 1}`}</Label>
              </View>
              <Chip label="Trocar" icon="swap-horizontal" color={color} onPress={() => cycle(index)} />
            </View>
            <Stepper value={movement.reps} onChange={(reps) => setReps(index, reps)} min={1} max={50} color={color} valueSize={36} unit="reps" />
          </Card>
        );
      })}

      <Card entering={staggerEntering(5)}>
        <Text variant="heading">{`${perRound} reps/round · AMRAP ${duration} min`}</Text>
        {pr ? (
          <Chip icon="trophy" color="#FFC53D" label={`Seu PR: ${pr.completedRounds} + ${pr.additionalReps}`} />
        ) : (
          <Text variant="caption">Ainda sem PR nesta configuração. Hora de criar o primeiro.</Text>
        )}
      </Card>

      <Button size="lg" icon="flash" loading={starting} onPress={start}>Começar</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  name: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 26 },
});

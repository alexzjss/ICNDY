import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Chip, EmptyState, Field, Header, IconButton, Label, MovementPill, Screen, staggerEntering, Stepper, Text, useToast } from '../../components';
import { useApp } from '../../context/AppContext';
import { deleteSession, updateSession } from '../../database/repositories';
import { formatDayMonth } from '../../domain/dates';
import { PartialProgress, WorkoutSession } from '../../domain/models';
import { repsPerRound, sessionTitle } from '../../domain/presets';
import { additionalRepsFromPartial } from '../../domain/scoring';
import { formatDuration, RPE_COLORS, RPE_LABELS } from '../../features/session/format';
import { PartialPicker } from '../../features/session/PartialPicker';
import { partialFromAdditional } from '../../features/session/partial';
import { RpePicker } from '../../features/session/RpePicker';
import { SplitsChart } from '../../features/session/SplitsChart';
import { colors, fonts } from '../../theme';

const realDurationMs = (session: WorkoutSession) => {
  if (session.completionType === 'ended-early') {
    if (session.elapsedBeforePauseMs > 0) return session.elapsedBeforePauseMs;
    if (session.finishedAt) return Math.max(0, Date.parse(session.finishedAt) - Date.parse(session.startedAt) - session.pausedDurationMs);
  }
  return session.durationSeconds * 1000;
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { sessions, refresh } = useApp();
  const session = sessions.find((item) => item.id === id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [partial, setPartial] = useState<PartialProgress>({ movementIndex: 0, reps: 0 });
  const [rpe, setRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState('');

  const startEdit = () => {
    if (!session) return;
    setRounds(session.completedRounds);
    setPartial(session.partial ?? partialFromAdditional(session.movements, session.additionalReps));
    setRpe(session.rpe);
    setNotes(session.notes ?? '');
    setEditing(true);
  };

  useEffect(() => {
    if (!session) setEditing(false);
  }, [session]);

  if (!session) {
    return (
      <Screen>
        <Header back title="Treino" />
        <EmptyState icon="search-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." action={{ label: 'Voltar', onPress: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')) }} />
      </Screen>
    );
  }

  const additional = additionalRepsFromPartial(session.movements, partial);
  const perRound = repsPerRound(session);
  const previewTotal = rounds * perRound + additional;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Splits além dos rounds editados deixam de valer; rounds extras ficam sem split registrado.
      await updateSession(session.id, { completedRounds: rounds, additionalReps: additional, partial, rpe, notes: notes.trim() || undefined, roundSplitsMs: session.roundSplitsMs.slice(0, rounds) });
      await refresh();
      setEditing(false);
      toast.show({ message: 'Treino atualizado', variant: 'success' });
    } catch (error) {
      Alert.alert('Não foi possível salvar', String(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Excluir treino?', 'Esta ação não pode ser desfeita e o treino sai do histórico e das sequências.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(session.id);
            await refresh();
            toast.show({ message: 'Treino excluído' });
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          } catch (error) {
            Alert.alert('Não foi possível excluir', String(error));
          }
        },
      },
    ]);

  const durationLabel = session.completionType === 'ended-early' ? `Encerrado em ${formatDuration(realDurationMs(session))}` : `${Math.round(session.durationSeconds / 60)} min completos`;

  return (
    <Screen>
      <Header
        back
        eyebrow={formatDayMonth(session.localDate)}
        title={sessionTitle(session)}
        right={editing ? undefined : <IconButton icon="create-outline" variant="solid" accessibilityLabel="Editar treino" onPress={startEdit} />}
      />

      {editing ? (
        <>
          <Card entering={staggerEntering(1)}>
            <Label>Rounds completos</Label>
            <Stepper value={rounds} onChange={setRounds} min={0} max={200} unit="rounds" />
          </Card>
          <Card entering={staggerEntering(2)}>
            <Label>Onde você parou no round?</Label>
            <PartialPicker movements={session.movements} value={partial} onChange={setPartial} />
          </Card>
          <Card entering={staggerEntering(3)}>
            <Label>Esforço percebido (RPE)</Label>
            <RpePicker value={rpe} onChange={setRpe} />
          </Card>
          <Card entering={staggerEntering(4)}>
            <Label>Notas</Label>
            <Field multiline value={notes} onChangeText={setNotes} placeholder="Como foi?" maxLength={500} />
          </Card>
          <Text variant="heading" align="center">{`Novo resultado: ${rounds} + ${additional} (${previewTotal} reps)`}</Text>
          <Button icon="checkmark" loading={saving} onPress={save}>Salvar alterações</Button>
          <Button variant="ghost" disabled={saving} onPress={() => setEditing(false)}>Cancelar edição</Button>
        </>
      ) : (
        <>
          <Card entering={staggerEntering(1)} style={styles.scoreCard}>
            <Label>Resultado</Label>
            <View style={styles.score}>
              <Text style={styles.rounds}>{session.completedRounds}</Text>
              <Text style={styles.extra}>{`+ ${session.additionalReps}`}</Text>
            </View>
            <Text variant="caption">{`${session.totalReps} reps · ${perRound} por round`}</Text>
            <View style={styles.chips}>
              <Chip icon="time-outline" label={durationLabel} />
              {session.rpe ? <Chip icon="flame-outline" label={`RPE ${session.rpe} · ${RPE_LABELS[session.rpe]}`} color={RPE_COLORS[session.rpe - 1]} /> : null}
            </View>
          </Card>

          <Card entering={staggerEntering(2)}>
            <Label>Configuração</Label>
            <View style={styles.pills}>
              {session.movements.map((movement, index) => (
                <MovementPill key={`${movement.key}-${index}`} movement={movement} />
              ))}
            </View>
          </Card>

          <Card entering={staggerEntering(3)}>
            <Label>Tempo por round</Label>
            <SplitsChart splits={session.roundSplitsMs} />
          </Card>

          {session.notes ? (
            <Card entering={staggerEntering(4)}>
              <Label>Notas</Label>
              <Text variant="body">{session.notes}</Text>
            </Card>
          ) : null}

          <Button variant="ghost" icon="trash-outline" onPress={remove}>Excluir treino</Button>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreCard: { alignItems: 'center', paddingVertical: 22 },
  score: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  rounds: { fontFamily: fonts.displayBold, fontSize: 110, lineHeight: 112, color: colors.text, fontVariant: ['tabular-nums'] },
  extra: { fontFamily: fonts.display, fontSize: 48, lineHeight: 70, color: colors.muted, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  pills: { gap: 8 },
});

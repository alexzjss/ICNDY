import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button, Card, MovementPill, Screen, Text } from '../../components';
import { useApp } from '../../context/AppContext';
import { activeElapsedMs, remainingMs, formatRemaining, isExpired } from '../../domain/timer';
import { sessionTitle } from '../../domain/presets';
import { totalReps } from '../../domain/scoring';
import { cancelWorkoutEnd, scheduleWorkoutEnd } from '../../services/notifications';
import { colors } from '../../theme';
export default function ActiveWorkoutScreen() {
  useKeepAwake(); const router = useRouter(); const { active, saveActive } = useApp(); const finishing = useRef(false); const [now, setNow] = useState(Date.now());
  const finishTimed = useCallback(async (completionType: 'timer-finished' | 'ended-early' = 'timer-finished') => { if (!active || active.status === 'finishing' || finishing.current) return; finishing.current = true; const next = { ...active, status: 'finishing' as const, completionType, updatedAt: new Date().toISOString() }; await saveActive(next); router.replace('/workout/summary'); }, [active, saveActive, router]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  useEffect(() => { if (active && active.status === 'active' && isExpired({ durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs }, now)) finishTimed().catch((error) => Alert.alert('Erro no treino', String(error))); }, [active, now, finishTimed]);
  useEffect(() => { const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') { setNow(Date.now()); void cancelWorkoutEnd(); } else if (state === 'background' && active && active.status === 'active') { const endAt = Date.parse(active.startedAt) + active.pausedDurationMs + active.durationSeconds * 1000; void scheduleWorkoutEnd(endAt).catch(() => undefined); } }); return () => subscription.remove(); }, [active]);
  if (!active) return <Screen><Text variant="title">Nenhum treino ativo</Text><Button onPress={() => router.replace('/workout/setup')}>Configurar treino</Button></Screen>;
  const timerState = { durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs };
  const pause = async () => { const pausedAt = new Date().toISOString(); const elapsed = active.status === 'active' ? active.durationSeconds * 1000 - remainingMs(timerState, Date.now()) : active.elapsedBeforePauseMs; await saveActive({ ...active, status: 'paused', pausedAt, elapsedBeforePauseMs: elapsed, updatedAt: pausedAt }); };
  const resume = async () => { await saveActive({ ...active, status: 'active', pausedAt: undefined, pausedDurationMs: active.pausedAt ? active.pausedDurationMs + Date.now() - Date.parse(active.pausedAt) : active.pausedDurationMs, updatedAt: new Date().toISOString() }); };
  const round = async () => { const tapAt = Date.now(); if (active.status !== 'active' || tapAt < timerState.startedAtMs || isExpired(timerState, tapAt)) return; void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); const rounds = active.completedRounds + 1; await saveActive({ ...active, completedRounds: rounds, roundSplitsMs: [...active.roundSplitsMs, activeElapsedMs(timerState, tapAt)], totalReps: totalReps(rounds, 0, active), updatedAt: new Date().toISOString() }); };
  const earlyFinish = () => Alert.alert('Encerrar antes?', 'Você informará as repetições restantes e o tempo decorrido será salvo.', [{ text: 'Continuar', style: 'cancel' }, { text: 'Encerrar', style: 'destructive', onPress: () => finishTimed('ended-early').catch((error) => Alert.alert('Não foi possível encerrar', String(error))) }]);
  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <Text variant="label">{sessionTitle(active)} / {active.status === 'paused' ? 'PAUSADO' : 'EM ANDAMENTO'}</Text>
        <Text variant="display" style={styles.timer}>{formatRemaining(remainingMs(timerState, now))}</Text>
        <Text variant="number" color={colors.accent}>{active.completedRounds} <Text variant="label">ROUNDS</Text></Text>
      </View>
      <Card>{active.movements.map((movement) => <MovementPill key={movement.key} movement={movement} />)}</Card>
      <Button size="lg" onPress={round}>Round completo</Button>
      <View style={styles.actions}>
        <Button variant="secondary" fullWidth={false} style={styles.flex} onPress={active.status === 'paused' ? resume : pause}>{active.status === 'paused' ? 'Retomar' : 'Pausar'}</Button>
        <Button variant="secondary" fullWidth={false} style={styles.flex} onPress={earlyFinish}>Encerrar</Button>
      </View>
      <Text variant="caption" align="center">Toque uma vez por round completo. O cronômetro usa timestamps e se recupera após ir para segundo plano.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ top: { alignItems: 'center', paddingTop: 30, gap: 12 }, timer: { fontSize: 96, lineHeight: 96 }, actions: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 } });

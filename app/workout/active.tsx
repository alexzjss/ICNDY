import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { remainingMs, formatRemaining, isExpired, progressRatio } from '../../src/domain/timer';
import { repsPerRound } from '../../src/domain/scoring';
import { saveSession } from '../../src/database/repositories';
import { colors } from '../../src/theme';
import { triggerFeedback } from '../../src/services/feedback';
export default function ActiveWorkoutScreen() {
  useKeepAwake(); const router = useRouter(); const { active, refresh, settings } = useApp(); const [now, setNow] = useState(Date.now()); const roundLock = useRef(false);
  const finishTimed = useCallback(async (completionType: 'timer-finished' | 'ended-early' = 'timer-finished') => { if (!active || active.status === 'finishing') return; triggerFeedback('workout-finish', settings); const next = { ...active, status: 'finishing' as const, completionType, updatedAt: new Date().toISOString() }; await saveSession(next); await refresh(); router.replace('/workout/summary'); }, [active, refresh, router, settings]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  useEffect(() => { if (active && active.status === 'active' && isExpired({ durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs }, now)) finishTimed().catch((error) => Alert.alert('Workout error', String(error))); }, [active, now, finishTimed]);
  useEffect(() => { const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(Date.now()); }); return () => subscription.remove(); }, []);
  if (!active) return <Screen><Title>No active workout</Title><Button onPress={() => router.replace('/workout/setup')}>Set up workout</Button></Screen>;
  const timerState = { durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs };
  const pause = async () => { const pausedAt = new Date().toISOString(); const elapsed = active.status === 'active' ? active.durationSeconds * 1000 - remainingMs(timerState, Date.now()) : active.elapsedBeforePauseMs; await saveSession({ ...active, status: 'paused', pausedAt, elapsedBeforePauseMs: elapsed, updatedAt: pausedAt }); await refresh(); };
  const resume = async () => { triggerFeedback('workout-resume', settings); await saveSession({ ...active, status: 'active', pausedAt: undefined, pausedDurationMs: active.pausedAt ? active.pausedDurationMs + Date.now() - Date.parse(active.pausedAt) : active.pausedDurationMs, updatedAt: new Date().toISOString() }); await refresh(); };
  const round = async () => {
    if (roundLock.current || active.status !== 'active' || isExpired(timerState, Date.now())) return;
    roundLock.current = true;
    try {
      triggerFeedback('round-complete', settings);
      await saveSession({ ...active, completedRounds: active.completedRounds + 1, updatedAt: new Date().toISOString() });
      await refresh();
    } finally { roundLock.current = false; }
  };
  const undoRound = async () => {
    if (active.status !== 'active' || active.completedRounds < 1 || roundLock.current) return;
    await saveSession({ ...active, completedRounds: active.completedRounds - 1, updatedAt: new Date().toISOString() });
    await refresh();
  };
  const earlyFinish = () => Alert.alert('Finish early?', 'You will enter remaining reps and save the actual elapsed time.', [{ text: 'Keep going', style: 'cancel' }, { text: 'Finish', style: 'destructive', onPress: () => finishTimed('ended-early').catch((error) => Alert.alert('Could not finish', String(error))) }]);
  const ratio = progressRatio(timerState, now);
  const remaining = formatRemaining(remainingMs(timerState, now));
  return <Screen scroll={false}><View style={styles.top}><Label>{active.presetId === 'classic' ? 'CLASSIC CINDY' : 'BEGINNER CINDY'} / {active.status.toUpperCase()}</Label>{settings.timerDisplay === 'circular' ? <View style={styles.timerRing}><Svg width="190" height="190" viewBox="0 0 190 190"><Circle cx="95" cy="95" r="82" stroke={colors.surfaceRaised} strokeWidth="10" fill="none" /><Circle cx="95" cy="95" r="82" stroke={colors.lime} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${Math.round(515 * ratio)} 515`} transform="rotate(-90 95 95)" /></Svg><Text style={styles.ringText}>{remaining}</Text></View> : <Text style={styles.timer}>{remaining}</Text>}<Text style={styles.timerLabel}>{Math.round(ratio * 100)}% TIME REMAINING</Text><Text style={styles.rounds}>{active.completedRounds}<Text style={styles.roundLabel}> ROUNDS</Text></Text><Text style={styles.repsTotal}>{active.completedRounds * repsPerRound(active)} reps logged</Text></View><Card accent><View style={styles.sequence}>{active.movements.map((movement) => <View key={movement.key}><Text style={styles.reps}>{movement.reps}</Text><Text style={styles.movement}>{movement.label}</Text></View>)}</View></Card><Button onPress={round}>Round complete  →</Button><Button secondary onPress={undoRound}>Undo last round</Button><View style={styles.actions}><Button secondary onPress={active.status === 'paused' ? resume : pause}>{active.status === 'paused' ? 'Resume' : 'Pause'}</Button><Button secondary onPress={earlyFinish}>Finish early</Button></View><Text style={styles.hint}>Tap once per fully completed round. The timer is based on timestamps and recovers after backgrounding.</Text></Screen>;
}
const styles = StyleSheet.create({ top: { alignItems: 'center', paddingTop: 30, gap: 8 }, timer: { color: colors.text, fontSize: 72, fontWeight: '900', letterSpacing: -3 }, timerRing: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }, ringText: { position: 'absolute', color: colors.text, fontSize: 38, fontWeight: '900' }, timerLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, rounds: { color: colors.lime, fontSize: 50, fontWeight: '900', marginTop: 10 }, roundLabel: { color: colors.muted, fontSize: 14, letterSpacing: 1 }, repsTotal: { color: colors.muted, fontSize: 13 }, sequence: { flexDirection: 'row', justifyContent: 'space-between' }, reps: { color: colors.lime, fontSize: 24, fontWeight: '900' }, movement: { color: colors.muted, fontSize: 11, marginTop: 4 }, actions: { flexDirection: 'row', gap: 10 }, hint: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 } });

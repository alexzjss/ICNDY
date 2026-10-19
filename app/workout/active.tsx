import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { remainingMs, formatRemaining, isExpired, progressRatio } from '../../src/domain/timer';
import { repsPerRound } from '../../src/domain/scoring';
import { saveSession } from '../../src/database/repositories';
import { colors } from '../../src/theme';
import { triggerFeedback } from '../../src/services/feedback';
import { localizedMovementLabel } from '../../src/domain/presets';

const REST_SECONDS = 60;
const RING = 2 * Math.PI * 88;

export default function ActiveWorkoutScreen() {
  useKeepAwake();
  const router = useRouter();
  const { active, refresh, settings } = useApp();
  const { width, height } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const buttonScale = useRef(new Animated.Value(1)).current;
  const roundLock = useRef(false);
  const finishLock = useRef(false);
  const compact = height < 760 || width < 360;

  const finishTimed = useCallback(async (completionType: 'timer-finished' | 'ended-early' = 'timer-finished') => {
    if (!active || active.status === 'finishing' || finishLock.current) return;
    finishLock.current = true;
    try {
      triggerFeedback('workout-finish', settings);
      const next = { ...active, status: 'finishing' as const, restStartedAt: undefined, restDurationSeconds: undefined, completionType, updatedAt: new Date().toISOString() };
      await saveSession(next);
      await refresh();
      router.replace('/workout/summary');
    } catch (error) {
      finishLock.current = false;
      throw error;
    }
  }, [active, refresh, router, settings]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (active && active.status === 'active' && isExpired({ durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs }, now)) {
      finishTimed().catch((error) => Alert.alert('Erro no treino', String(error)));
    }
  }, [active, now, finishTimed]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(Date.now()); });
    return () => subscription.remove();
  }, []);

  if (!active) return <Screen><Text style={styles.emptyTitle}>Nenhum treino ativo</Text><Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')}><Text style={styles.secondaryText}>Voltar ao início</Text></Pressable></Screen>;

  const timerState = { durationMs: active.durationSeconds * 1000, startedAtMs: Date.parse(active.startedAt), pausedAtMs: active.pausedAt ? Date.parse(active.pausedAt) : undefined, pausedDurationMs: active.pausedDurationMs, elapsedBeforePauseMs: active.elapsedBeforePauseMs };
  const restDuration = (active.restDurationSeconds ?? REST_SECONDS) * 1000;
  const restRemaining = active.restStartedAt ? Math.max(0, restDuration - (now - Date.parse(active.restStartedAt))) : 0;
  const resting = Boolean(active.restStartedAt && restRemaining > 0 && active.status === 'active');
  const pause = async () => {
    const pausedAt = new Date().toISOString();
    const elapsed = active.status === 'active' ? active.durationSeconds * 1000 - remainingMs(timerState, Date.now()) : active.elapsedBeforePauseMs;
    await saveSession({ ...active, status: 'paused', pausedAt, elapsedBeforePauseMs: elapsed, updatedAt: pausedAt });
    await refresh();
  };
  const resume = async () => {
    triggerFeedback('workout-resume', settings);
    await saveSession({ ...active, status: 'active', pausedAt: undefined, pausedDurationMs: active.pausedAt ? active.pausedDurationMs + Date.now() - Date.parse(active.pausedAt) : active.pausedDurationMs, updatedAt: new Date().toISOString() });
    await refresh();
  };
  const round = async () => {
    if (roundLock.current || active.status !== 'active' || isExpired(timerState, Date.now())) return;
    roundLock.current = true;
    try {
      triggerFeedback('round-complete', settings);
      const nowIso = new Date().toISOString();
      await saveSession({ ...active, completedRounds: active.completedRounds + 1, restStartedAt: nowIso, restDurationSeconds: REST_SECONDS, updatedAt: nowIso });
      await refresh();
    } finally { roundLock.current = false; }
  };
  const undoRound = async () => {
    if (active.status !== 'active' || active.completedRounds < 1 || roundLock.current) return;
    const remainingRounds = active.completedRounds - 1;
    await saveSession({ ...active, completedRounds: remainingRounds, restStartedAt: remainingRounds ? active.restStartedAt : undefined, restDurationSeconds: remainingRounds ? active.restDurationSeconds : undefined, updatedAt: new Date().toISOString() });
    await refresh();
  };
  const skipRest = async () => {
    await saveSession({ ...active, restStartedAt: undefined, restDurationSeconds: undefined, updatedAt: new Date().toISOString() });
    await refresh();
  };
  const earlyFinish = () => Alert.alert('Encerrar treino?', 'Você informa as repetições restantes e salva o tempo real.', [{ text: 'Continuar', style: 'cancel' }, { text: 'Encerrar', style: 'destructive', onPress: () => finishTimed('ended-early').catch((error) => Alert.alert('Não foi possível encerrar', String(error))) }]);
  const ratio = progressRatio(timerState, now);
  const remaining = formatRemaining(remainingMs(timerState, now));
  const circumference = RING;
  const progressOffset = circumference * (1 - ratio);

  return <Screen scroll={false}><View style={[styles.screen, compact && styles.screenCompact]}>
    <View style={styles.header}>
      <View><Text style={styles.brand}>ICNDY<Text style={styles.brandSlash}> / </Text><Text style={styles.headerDetail}>{active.presetId === 'classic' ? 'CINDY CLÁSSICA' : 'CINDY INICIANTE'}</Text></Text><View style={styles.liveLine}><View style={styles.liveDot} /><Text style={styles.live}>{active.status === 'paused' ? 'PAUSADO' : 'SESSÃO EM ANDAMENTO'}</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Encerrar treino" onPress={earlyFinish} style={styles.exit}><Text style={styles.exitText}>ENCERRAR</Text></Pressable>
    </View>

    <View style={[styles.timerBlock, compact && styles.timerBlockCompact]}>
      <View style={[styles.ringWrap, compact && styles.ringWrapCompact]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Circle cx="100" cy="100" r="88" stroke="#1D241D" strokeWidth="8" fill="none" />
          <Circle cx="100" cy="100" r="88" stroke={active.status === 'paused' ? colors.muted : colors.lime} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset} transform="rotate(-90 100 100)" />
        </Svg>
        <View style={styles.timerCenter}>
      <Text style={styles.timeCaption}>{active.status === 'paused' ? 'TEMPO PAUSADO' : 'TEMPO RESTANTE'}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.timer, compact && styles.timerCompact]}>{remaining}</Text>
          <Text style={styles.percent}>{Math.round(ratio * 100)}% DO TREINO</Text>
        </View>
      </View>
      <Text style={styles.timerSub}>{active.completedRounds ? 'RITMO EM CONSTRUÇÃO' : 'COMECE NO SEU RITMO'}</Text>
    </View>

    <View style={styles.scoreRow}>
      <View><Text style={styles.scoreEyebrow}>SÉRIES CONCLUÍDAS</Text><Text style={styles.score}>{String(active.completedRounds).padStart(2, '0')}<Text style={styles.scoreUnit}> VOLTAS</Text></Text></View>
      <View style={styles.repBadge}><Text style={styles.repNumber}>{active.completedRounds * repsPerRound(active)}</Text><Text style={styles.repLabel}>REPS</Text></View>
    </View>

    <View style={styles.movements}>{active.movements.map((movement, index) => <View key={movement.key} style={[styles.movement, index === active.movements.length - 1 && styles.movementLast]}><Text style={styles.movementCount}>{String(movement.reps).padStart(2, '0')}</Text><Text style={styles.movementName}>{localizedMovementLabel(movement).toUpperCase()}</Text><Text style={styles.movementDot}>●</Text></View>)}</View>

    {resting && <View style={styles.restCard}><View style={styles.restHeader}><View><Text style={styles.restEyebrow}>RECUPERAÇÃO</Text><Text style={styles.restTitle}>Respire. Você merece.</Text></View><Text style={styles.restTime}>{formatRemaining(restRemaining)}</Text></View><View style={styles.restTrack}><View style={[styles.restFill, { width: `${Math.max(0, Math.min(1, 1 - restRemaining / restDuration)) * 100}%` }]} /></View><Pressable onPress={skipRest} style={styles.skipRest}><Text style={styles.skipRestText}>PULAR DESCANSO  ↗</Text></Pressable></View>}

    <Animated.View style={{ width: '100%', transform: [{ scale: buttonScale }] }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Adicionar volta concluída" accessibilityHint="Registra uma volta e inicia 60 segundos de descanso" disabled={active.status !== 'active'} onPress={round} onPressIn={() => !settings.reduceMotion && Animated.spring(buttonScale, { toValue: 0.96, speed: 35, useNativeDriver: true }).start()} onPressOut={() => !settings.reduceMotion && Animated.spring(buttonScale, { toValue: 1, speed: 20, bounciness: 9, useNativeDriver: true }).start()} style={[styles.roundButton, compact && styles.roundButtonCompact, active.status !== 'active' && styles.disabled]}>
          <View style={styles.buttonIcon}><Text style={styles.plus}>+</Text></View>
          <View style={styles.buttonWords}><Text style={styles.buttonTitle}>{resting ? 'SÉRIE CONCLUÍDA' : 'ADICIONAR SÉRIE'}</Text><Text style={styles.buttonSub}>{resting ? 'REGISTRAR PRÓXIMA VOLTA' : 'TOQUE AO FINALIZAR A VOLTA'}</Text></View>
          <Text style={styles.buttonArrow}>↗</Text>
        </Pressable>
    </Animated.View>

    <View style={styles.footerActions}><Pressable onPress={active.status === 'paused' ? resume : pause} style={styles.secondaryButton}><Text style={styles.secondaryText}>{active.status === 'paused' ? '▶  RETOMAR' : 'Ⅱ  PAUSAR'}</Text></Pressable><Pressable disabled={active.completedRounds < 1 || roundLock.current} onPress={undoRound} style={[styles.secondaryButton, active.completedRounds < 1 && styles.disabled]}><Text style={styles.secondaryText}>↶  DESFAZER</Text></Pressable></View>
    <Text style={styles.footerHint}>{resting ? 'Descanse ou registre a próxima volta quando estiver pronto.' : 'Concentre-se na execução. O cronômetro salva seu progresso automaticamente.'}</Text>
  </View></Screen>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20, justifyContent: 'space-between', gap: 12 },
  screenCompact: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8, gap: 7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 1.5 }, brandSlash: { color: colors.lime }, headerDetail: { color: colors.muted, fontSize: 11, letterSpacing: 1 }, liveLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }, live: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, exit: { paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#151A16', borderColor: colors.line, borderWidth: 1 }, exitText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  timerBlock: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', minHeight: 190 }, timerBlockCompact: { minHeight: 155 }, ringWrap: { width: 224, height: 224, alignItems: 'center', justifyContent: 'center' }, ringWrapCompact: { width: 184, height: 184 }, timerCenter: { position: 'absolute', alignItems: 'center', width: '75%' }, timeCaption: { color: colors.muted, fontWeight: '900', fontSize: 9, letterSpacing: 2 }, timer: { color: colors.text, fontSize: 52, fontWeight: '900', letterSpacing: -2, marginVertical: 5, fontVariant: ['tabular-nums'] }, timerCompact: { fontSize: 42 }, percent: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, timerSub: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 }, scoreEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, score: { color: colors.lime, fontSize: 37, lineHeight: 42, fontWeight: '900', letterSpacing: -1 }, scoreUnit: { color: colors.muted, fontSize: 10, letterSpacing: 1 }, repBadge: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#131713', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 14, alignItems: 'center' }, repNumber: { color: colors.text, fontSize: 18, fontWeight: '900' }, repLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  movements: { flexDirection: 'row', backgroundColor: '#121612', borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 6 }, movement: { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, borderRightWidth: 1, borderRightColor: colors.line }, movementLast: { borderRightWidth: 0 }, movementCount: { color: colors.lime, fontSize: 16, fontWeight: '900' }, movementName: { color: colors.muted, fontSize: 7, fontWeight: '800', textAlign: 'center', letterSpacing: 0.6 }, movementDot: { color: '#53604B', fontSize: 6 },
  restCard: { padding: 13, borderRadius: 16, backgroundColor: '#172014', borderWidth: 1, borderColor: '#40522D', gap: 9 }, restHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, restEyebrow: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, restTitle: { color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 3 }, restTime: { color: colors.lime, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }, restTrack: { height: 4, borderRadius: 9, overflow: 'hidden', backgroundColor: '#2A3326' }, restFill: { height: '100%', backgroundColor: colors.lime }, skipRest: { alignSelf: 'flex-end', paddingVertical: 2 }, skipRestText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  roundButton: { width: '100%', minHeight: 76, borderRadius: 20, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 5, borderBottomColor: '#82A824', shadowColor: colors.lime, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 5 }, roundButtonCompact: { minHeight: 64, borderRadius: 17 }, buttonIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(9,14,7,0.10)', alignItems: 'center', justifyContent: 'center' }, plus: { color: colors.ink, fontSize: 31, fontWeight: '500', marginTop: -3 }, buttonWords: { flex: 1, paddingLeft: 14 }, buttonTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 }, buttonSub: { color: '#344213', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 4 }, buttonArrow: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  footerActions: { flexDirection: 'row', gap: 10 }, secondaryButton: { flex: 1, minHeight: 46, backgroundColor: '#151A16', borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, footerHint: { color: '#777E75', textAlign: 'center', fontSize: 9, lineHeight: 14 }, disabled: { opacity: 0.45 }, emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 24 },
});

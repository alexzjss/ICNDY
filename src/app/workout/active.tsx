import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, haptic, HoldButton, IconButton, Screen, useToast } from '../../components';
import { useApp } from '../../context/AppContext';
import { findPersonalBest } from '../../domain/pace';
import { sessionTitle } from '../../domain/presets';
import { totalReps } from '../../domain/scoring';
import { activeElapsedMs, formatRemaining, isExpired, remainingMs } from '../../domain/timer';
import { Hud } from '../../features/workout/Hud';
import { Liquid, Ripple } from '../../features/workout/Liquid';
import { CountdownView, PauseOverlay, TimeUp } from '../../features/workout/Overlays';
import { PaceChip } from '../../features/workout/PaceChip';
import { timerStateOf } from '../../features/workout/session';
import { cancelWorkoutEnd, scheduleWorkoutEnd } from '../../services/notifications';
import { playBeep, preloadSounds, releaseSounds } from '../../services/sounds';
import { colors, fonts, roundColor, withAlpha } from '../../theme';

type Countdown = number | 'go' | null;

export default function ActiveWorkoutScreen() {
  useKeepAwake();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { active, sessions, saveActive, discardSession, settings } = useApp();

  // Estado "quente" em refs: toques e tick não dependem de re-render.
  const sessionRef = useRef(active);
  if (active && (!sessionRef.current || active.id !== sessionRef.current.id || active.updatedAt >= sessionRef.current.updatedAt)) sessionRef.current = active;
  const soundRef = useRef(settings.soundEnabled);
  soundRef.current = settings.soundEnabled;
  const finishingRef = useRef(false);
  const lastCount = useRef<number | null>(null);
  const lastRemSec = useRef<number | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [countdown, setCountdown] = useState<Countdown>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [lastTapAt, setLastTapAt] = useState(0);

  // Valores compartilhados (UI thread)
  const initialRounds = active?.completedRounds ?? 0;
  const fill = useSharedValue(1);
  const colorFrom = useSharedValue(roundColor(initialRounds));
  const colorTo = useSharedValue(roundColor(initialRounds));
  const flood = useSharedValue(1);
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  const boost = useSharedValue(0);
  const ripple = useSharedValue(0);
  const pop = useSharedValue(1);

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(setTimeout(fn, ms));
  }, []);

  const pr = useMemo(() => (active ? findPersonalBest(sessions, active.comparisonKey, active.id) : undefined), [sessions, active?.comparisonKey, active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Líquido: anima o nível no UI thread a partir do restante real ---
  const syncFill = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const t = timerStateOf(s);
    const now = Date.now();
    const rem = remainingMs(t, now);
    cancelAnimation(fill);
    fill.value = rem / t.durationMs;
    if (s.status === 'active' && rem > 0) {
      const delay = Math.max(0, t.startedAtMs - now);
      fill.value = withDelay(delay, withTiming(0, { duration: rem, easing: Easing.linear }));
    }
  }, [fill]);

  const status = active?.status;
  const startedAt = active?.startedAt;
  const pausedDurationMs = active?.pausedDurationMs;
  const elapsedBeforePauseMs = active?.elapsedBeforePauseMs;
  useEffect(() => {
    syncFill();
  }, [syncFill, status, startedAt, pausedDurationMs, elapsedBeforePauseMs]);

  // --- Efeito visual de round (inundação + ripple + pulo do número) ---
  const celebrate = useCallback(
    (x: number, y: number, toColor: string) => {
      colorFrom.value = colorTo.value;
      colorTo.value = toColor;
      fx.value = x;
      fy.value = y;
      flood.value = 0;
      if (reduced) {
        flood.value = 1;
        return;
      }
      flood.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      ripple.value = 0;
      ripple.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
      boost.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 1000 }));
      pop.value = withSequence(withTiming(1.5, { duration: 90 }), withSpring(1, { damping: 6, stiffness: 180 }));
    },
    [colorFrom, colorTo, flood, fx, fy, reduced, ripple, boost, pop],
  );

  // --- Finalização (uma única vez) ---
  const finish = useCallback(
    (type: 'timer-finished' | 'ended-early') => {
      const s = sessionRef.current;
      if (!s || finishingRef.current) return;
      finishingRef.current = true;
      const now = Date.now();
      const t = timerStateOf(s);
      const next = {
        ...s,
        status: 'finishing' as const,
        completionType: type,
        pausedAt: undefined,
        elapsedBeforePauseMs: type === 'timer-finished' ? t.durationMs : activeElapsedMs(t, now),
        updatedAt: new Date(now).toISOString(),
      };
      sessionRef.current = next;
      cancelAnimation(fill);
      void cancelWorkoutEnd();
      saveActive(next).catch((error) => Alert.alert('Erro ao encerrar o treino', String(error)));
      if (type === 'timer-finished') {
        fill.value = 0;
        playBeep('final', soundRef.current);
        haptic.heavy();
        setTimeUp(true);
        later(() => router.replace('/workout/summary'), 1200);
      } else {
        later(() => router.replace('/workout/summary'), 150);
      }
    },
    [fill, later, router, saveActive],
  );

  // Entrou com status 'finishing' (ex.: reabriu o app) -> vai direto ao resumo.
  useEffect(() => {
    if (active?.status === 'finishing' && !finishingRef.current) {
      finishingRef.current = true;
      router.replace('/workout/summary');
    }
  }, [active?.status, router]);

  // --- Sons ---
  useEffect(() => {
    void preloadSounds();
    return () => releaseSounds();
  }, []);

  // --- Tick do motor (countdown, bipes, fim) — sem estado a cada tick ---
  useEffect(() => {
    const tick = () => {
      const s = sessionRef.current;
      if (!s || finishingRef.current || s.status === 'finishing') return;
      const now = Date.now();
      const t = timerStateOf(s);
      if (now < t.startedAtMs) {
        const n = Math.ceil((t.startedAtMs - now) / 1000);
        if (n !== lastCount.current) {
          lastCount.current = n;
          setCountdown(n);
          playBeep('short', soundRef.current);
          haptic.light();
        }
        return;
      }
      if (lastCount.current === null) {
        lastCount.current = -1;
      } else if (lastCount.current > 0) {
        lastCount.current = 0;
        setCountdown('go');
        playBeep('long', soundRef.current);
        haptic.heavy();
        later(() => setCountdown(null), 800);
      }
      if (s.status !== 'active') return;
      const rem = remainingMs(t, now);
      const sec = Math.ceil(rem / 1000);
      const prev = lastRemSec.current;
      lastRemSec.current = sec;
      if (prev !== null && sec < prev) {
        if (sec === 60) playBeep('long', soundRef.current);
        else if (sec >= 1 && sec <= 3) playBeep('short', soundRef.current);
      }
      if (rem === 0) finish('timer-finished');
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [finish, later]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  // --- Segundo plano: agenda "Tempo!" e recalcula por timestamps ao voltar ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const s = sessionRef.current;
      if (state === 'active') {
        void cancelWorkoutEnd();
        syncFill();
      } else if (state === 'background' && s && s.status === 'active' && !finishingRef.current) {
        const endAt = Date.parse(s.startedAt) + s.pausedDurationMs + s.durationSeconds * 1000;
        void scheduleWorkoutEnd(endAt).catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [syncFill]);

  // --- Ações ---
  const pause = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.status !== 'active' || finishingRef.current) return;
    const now = Date.now();
    const t = timerStateOf(s);
    if (now < t.startedAtMs) return;
    const next = { ...s, status: 'paused' as const, pausedAt: new Date(now).toISOString(), elapsedBeforePauseMs: activeElapsedMs(t, now), updatedAt: new Date(now).toISOString() };
    sessionRef.current = next;
    haptic.medium();
    saveActive(next).catch(() => undefined);
  }, [saveActive]);

  const resume = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.status !== 'paused' || finishingRef.current) return;
    const now = Date.now();
    const next = {
      ...s,
      status: 'active' as const,
      pausedAt: undefined,
      pausedDurationMs: s.pausedAt ? s.pausedDurationMs + now - Date.parse(s.pausedAt) : s.pausedDurationMs,
      updatedAt: new Date(now).toISOString(),
    };
    sessionRef.current = next;
    haptic.medium();
    saveActive(next).catch(() => undefined);
  }, [saveActive]);

  const undo = useCallback(() => {
    const s = sessionRef.current;
    if (!s || finishingRef.current || s.status !== 'active' || s.completedRounds === 0) return;
    const rounds = s.completedRounds - 1;
    const next = { ...s, completedRounds: rounds, roundSplitsMs: s.roundSplitsMs.slice(0, -1), totalReps: totalReps(rounds, 0, s), updatedAt: new Date().toISOString() };
    sessionRef.current = next;
    saveActive(next).catch(() => undefined);
    haptic.warning();
    celebrate(fx.value, 99999, roundColor(rounds));
    toast.show({ message: `Round ${rounds + 1} desfeito`, duration: 2500, offset: 28 });
  }, [saveActive, celebrate, toast, fx]);

  const onTap = useCallback(
    (x: number, y: number) => {
      const s = sessionRef.current;
      if (!s || finishingRef.current || s.status !== 'active') return;
      const now = Date.now();
      const t = timerStateOf(s);
      if (now < t.startedAtMs || isExpired(t, now)) return;
      const rounds = s.completedRounds + 1;
      const next = {
        ...s,
        completedRounds: rounds,
        roundSplitsMs: [...s.roundSplitsMs, activeElapsedMs(t, now)],
        totalReps: totalReps(rounds, 0, s),
        updatedAt: new Date(now).toISOString(),
      };
      sessionRef.current = next;
      saveActive(next).catch(() => undefined);
      haptic.medium();
      celebrate(x, y, roundColor(rounds));
      setLastTapAt(now);
      toast.show({ message: `Round ${rounds} registrado`, actionLabel: 'Desfazer', onAction: undo, duration: 4000, offset: 28 });
    },
    [saveActive, celebrate, toast, undo],
  );

  const handlers = useRef({ onTap, undo });
  handlers.current = { onTap, undo };
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDuration(600)
      .onEnd((event, success) => {
        if (success) handlers.current.onTap(event.x, event.y);
      });
    const hold = Gesture.LongPress()
      .runOnJS(true)
      .minDuration(600)
      .onStart(() => handlers.current.undo());
    return Gesture.Exclusive(hold, tap);
  }, []);

  const cancelCountdown = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    finishingRef.current = true;
    discardSession(s.id)
      .catch(() => undefined)
      .finally(() => router.replace('/(tabs)'));
  }, [discardSession, router]);

  // Botão voltar do Android: abre a pausa em vez de sair.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      pause();
      return true;
    });
    return () => sub.remove();
  }, [pause]);

  const timer = useMemo(
    () => (active ? timerStateOf(active) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active?.startedAt, active?.durationSeconds, active?.pausedAt, active?.pausedDurationMs, active?.elapsedBeforePauseMs],
  );

  if (!active || !timer) {
    return (
      <Screen>
        <EmptyState title="Nenhum treino ativo" message="Configure um treino para começar." action={{ label: 'Configurar treino', onPress: () => router.replace('/workout/setup') }} />
      </Screen>
    );
  }

  const paused = active.status === 'paused';
  const counting = countdown !== null && countdown !== 'go';
  const hud = (tone: 'light' | 'dark') => <Hud tone={tone} timer={timer} completedRounds={active.completedRounds} movements={active.movements} pop={pop} />;

  return (
    <View style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false} accessible accessibilityLabel="Toque para registrar um round. Segure para desfazer.">
          {hud('light')}
          <Liquid fill={fill} colorFrom={colorFrom} colorTo={colorTo} flood={flood} fx={fx} fy={fy} boost={boost}>
            {hud('dark')}
          </Liquid>
          <Ripple fx={fx} fy={fy} progress={ripple} />
        </View>
      </GestureDetector>

      <View pointerEvents="none" style={[styles.pace, { bottom: insets.bottom + 96 }]}>
        <PaceChip pr={pr} timer={timer} splits={active.roundSplitsMs} lastTapAt={lastTapAt} />
      </View>

      {paused ? <PauseOverlay onResume={resume} remaining={formatRemaining(remainingMs(timer, Date.now()))} /> : null}
      {counting || countdown === 'go' ? (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: countdown === 'go' ? withAlpha(colors.bg, 0.0) : colors.bg }]} pointerEvents={counting ? 'auto' : 'none'}>
          <CountdownView value={countdown as number | 'go'} />
        </Animated.View>
      ) : null}
      {timeUp ? <TimeUp /> : null}

      <View pointerEvents="box-none" style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.title}>
          <Text style={styles.titleText} numberOfLines={1}>{sessionTitle(active)}</Text>
        </View>
        <View style={styles.actions}>
          {counting ? (
            <IconButton icon="close" variant="solid" accessibilityLabel="Cancelar treino" onPress={cancelCountdown} />
          ) : (
            <>
              <IconButton
                icon={paused ? 'play' : 'pause'}
                variant="solid"
                accessibilityLabel={paused ? 'Retomar' : 'Pausar'}
                onPress={paused ? resume : pause}
                disabled={timeUp || countdown === 'go'}
              />
              <HoldButton shape="ring" icon="stop" ringSize={44} holdMs={1000} accessibilityLabel="Encerrar treino" onComplete={() => finish('ended-early')} style={styles.stop} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pace: { position: 'absolute', left: 0, right: 0 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 20 },
  title: { backgroundColor: withAlpha(colors.bg, 0.72), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexShrink: 1 },
  titleText: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 22, color: colors.text, letterSpacing: 0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stop: { backgroundColor: withAlpha(colors.bg, 0.72), borderRadius: 22 },
});

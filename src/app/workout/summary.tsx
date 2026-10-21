import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedNumber, Button, Card, Confetti, EmptyState, Field, haptic, Header, Label, Screen, staggerEntering, Text, useToast } from '../../components';
import { useApp } from '../../context/AppContext';
import { PartialProgress } from '../../domain/models';
import { findPersonalBest } from '../../domain/pace';
import { repsPerRound, sessionTitle } from '../../domain/presets';
import { additionalRepsFromPartial, totalReps as computeTotal } from '../../domain/scoring';
import { PartialPicker } from '../../features/session/PartialPicker';
import { RpePicker } from '../../features/session/RpePicker';
import { targetSummary } from '../../features/session/target';
import { SplitsChart } from '../../features/session/SplitsChart';
import { ShareResultModal } from '../../features/share/ShareResultModal';
import { streakIncluding } from '../../features/share/shareResult';
import { formatDayMonth } from '../../domain/dates';
import { colors, fonts, gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SummaryScreen() {
  const router = useRouter();
  const toast = useToast();
  const reduced = useReducedMotion();
  const { active, sessions, schedule, finishSession, discardSession } = useApp();
  const sessionRef = useRef(active);
  if (active) sessionRef.current = active;
  const session = sessionRef.current;

  const [partial, setPartial] = useState<PartialProgress>({ movementIndex: 0, reps: 0 });
  const [rpe, setRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [sharing, setSharing] = useState(false);
  const wasPr = useRef(false);

  const additional = session ? additionalRepsFromPartial(session.movements, partial) : 0;
  const total = session ? computeTotal(session.completedRounds, additional, session) : 0;
  const pr = useMemo(() => (session ? findPersonalBest(sessions, session.comparisonKey, session.id) : undefined), [sessions, session]);
  const isPr = Boolean(session) && total > 0 && total > (pr?.totalReps ?? 0);

  const badge = useSharedValue(0);
  useEffect(() => {
    if (isPr && !wasPr.current) {
      setConfetti((n) => n + 1);
      haptic.success();
      badge.value = reduced ? 1 : withDelay(400, withSequence(withSpring(1.25, { damping: 8 }), withSpring(1)));
    }
    if (!isPr) badge.value = withTiming(0, { duration: 150 });
    wasPr.current = isPr;
  }, [isPr, badge, reduced]);
  const badgeStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, badge.value * 3), transform: [{ scale: badge.value }] }));

  if (!session) {
    return (
      <Screen>
        <EmptyState title="Nenhum treino para concluir" message="Comece um novo treino quando quiser." action={{ label: 'Voltar ao início', onPress: () => router.replace('/(tabs)') }} />
      </Screen>
    );
  }

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await finishSession({
        ...session,
        status: 'completed',
        finishedAt: now,
        updatedAt: now,
        completionType: session.completionType ?? 'timer-finished',
        partial,
        additionalReps: additional,
        totalReps: total,
        rpe,
        notes: notes.trim() || undefined,
      });
      toast.show({ message: isPr ? 'Treino salvo. Novo PR!' : 'Treino salvo!', variant: 'success', offset: 96 });
      router.replace('/(tabs)');
    } catch (error) {
      setSaving(false);
      Alert.alert('Não foi possível salvar', String(error));
    }
  };

  const discard = () =>
    Alert.alert('Descartar treino?', 'Esta sessão não contará no histórico nem nas sequências.', [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          try {
            await discardSession(session.id);
            router.replace('/(tabs)');
          } catch (error) {
            Alert.alert('Não foi possível descartar', String(error));
          }
        },
      },
    ]);

  const perRound = repsPerRound(session);
  const goal = targetSummary(session.targetRounds, session.completedRounds);

  return (
    <View style={styles.root}>
      <Screen>
        <Header eyebrow={sessionTitle(session)} title={session.completionType === 'ended-early' ? 'Treino encerrado.' : 'Bom trabalho.'} />

        <Card entering={staggerEntering(1)} style={styles.scoreCard}>
          <Label>Resultado final</Label>
          <View style={styles.score}>
            <AnimatedNumber value={session.completedRounds} fontSize={110} duration={1100} style={styles.scoreMain} />
            <Text style={styles.plus}>+</Text>
            <AnimatedNumber value={additional} fontSize={64} duration={500} color={colors.muted} style={styles.extra} />
          </View>
          <Text variant="caption" align="center">{`${total} reps no total · ${perRound} reps por round`}</Text>
          {goal ? <Text variant="caption" align="center" color={goal.hit ? colors.success : colors.muted}>{goal.text}</Text> : null}
          <Animated.View style={[styles.badgeWrap, badgeStyle]} pointerEvents="none">
            <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.badge}>
              <Text style={styles.badgeText}>{pr ? 'NOVO PR' : 'PRIMEIRO PR'}</Text>
            </LinearGradient>
          </Animated.View>
        </Card>

        <Card entering={staggerEntering(2)}>
          <Label>Onde você parou no round?</Label>
          <PartialPicker movements={session.movements} value={partial} onChange={setPartial} />
        </Card>

        <Card entering={staggerEntering(3)}>
          <Label>Tempo por round</Label>
          <SplitsChart splits={session.roundSplitsMs} />
        </Card>

        <Card entering={staggerEntering(4)}>
          <Label>Esforço percebido (RPE)</Label>
          <RpePicker value={rpe} onChange={setRpe} />
        </Card>

        <Card entering={staggerEntering(5)}>
          <Label>Notas</Label>
          <Field multiline value={notes} onChangeText={setNotes} placeholder="Como foi? Sensações, ajustes, carga..." maxLength={500} />
        </Card>

        <Button size="lg" icon="checkmark" loading={saving} onPress={save}>Salvar resultado</Button>
        <Button variant="secondary" icon="share-social" disabled={saving} onPress={() => setSharing(true)}>Compartilhar</Button>
        <Button variant="ghost" disabled={saving} onPress={discard}>Descartar treino</Button>
      </Screen>
      <ShareResultModal
        visible={sharing}
        onClose={() => setSharing(false)}
        data={{
          title: sessionTitle(session),
          dateLabel: formatDayMonth(session.localDate),
          rounds: session.completedRounds,
          additional,
          totalReps: total,
          splits: session.roundSplitsMs,
          rpe,
          goalText: goal?.text,
          isPr,
          streak: streakIncluding(sessions, schedule, session),
        }}
      />
      <Confetti trigger={confetti} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scoreCard: { alignItems: 'center', paddingVertical: 24 },
  score: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  scoreMain: { fontFamily: fonts.displayBold, width: 150, textAlign: 'right' },
  extra: { width: 90 },
  plus: { fontFamily: fonts.display, fontSize: 40, lineHeight: 64, color: colors.muted },
  badgeWrap: { position: 'absolute', top: 12, right: 12 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.onAccent, letterSpacing: 1 },
});

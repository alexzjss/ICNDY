import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import { Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { calculateStreaks } from '../../src/domain/streaks';
import { colors } from '../../src/theme';
import { addDays, localDate } from '../../src/domain/dates';
import { getPreset, MOVEMENTS, repsPerRound } from '../../src/domain/presets';
import { comparisonKey } from '../../src/domain/scoring';
import { saveSession } from '../../src/database/repositories';
import { triggerFeedback } from '../../src/services/feedback';

type PresetId = 'classic' | 'beginner';

export default function HomeScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { sessions, active, settings, schedule, isInitialized, refresh } = useApp();
  const [streak, setStreak] = useState(0);
  const [presetId, setPresetId] = useState<PresetId>('classic');
  const [duration, setDuration] = useState(getPreset('classic').durationMinutes);
  const [movements, setMovements] = useState(getPreset('classic').movements);
  const [advanced, setAdvanced] = useState(false);
  const [starting, setStarting] = useState(false);
  const preset = getPreset(presetId);

  useEffect(() => { setStreak(calculateStreaks(sessions, schedule, localDate()).current); }, [sessions, schedule]);
  useEffect(() => {
    if (isInitialized && Boolean(navigationState?.key) && !settings.onboardingComplete) router.replace('/onboarding');
  }, [isInitialized, navigationState?.key, router, settings.onboardingComplete]);

  const selectPreset = (nextId: PresetId) => {
    setPresetId(nextId);
    const next = getPreset(nextId);
    setDuration(next.durationMinutes);
    setMovements(next.movements);
  };
  const changeMovement = (index: number) => {
    const movement = movements[index];
    const options = Object.values(MOVEMENTS).filter((option) => option.group === movement.group);
    const next = options[(options.findIndex((option) => option.key === movement.key) + 1) % options.length];
    setMovements(movements.map((item, itemIndex) => itemIndex === index ? { ...next, reps: movement.reps } : item));
  };
  const start = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const now = new Date().toISOString();
      await saveSession({ id: `session-${Date.now()}`, createdAt: now, startedAt: now, updatedAt: now, status: 'active', presetId, durationSeconds: duration * 60, movements, completedRounds: 0, additionalReps: 0, totalReps: 0, comparisonKey: comparisonKey({ durationSeconds: duration * 60, movements }), localDate: localDate(), pausedDurationMs: 0, elapsedBeforePauseMs: 0 });
      triggerFeedback('workout-start', settings);
      await refresh();
      router.push('/workout/active');
    } catch (error) {
      Alert.alert('Não foi possível iniciar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally { setStarting(false); }
  };

  const weekSessions = sessions.filter((session) => session.localDate >= addDays(localDate(), -6)).length;
  return <Screen>
    <View style={styles.top}><View><Text style={styles.brand}>ICNDY<Text style={styles.brandDot}>.</Text></Text><Text style={styles.tagline}>TREINO COM INTENÇÃO</Text></View><View style={styles.offline}><View style={styles.liveDot} /><Text style={styles.offlineText}>OFFLINE</Text></View></View>
    <View style={styles.hero}>
      <View style={styles.slashOne} /><View style={styles.slashTwo} />
      <Text style={styles.eyebrow}>BENCHMARK / CINDY</Text>
      <Title size={34}>{active ? 'Seu treino está em andamento.' : 'Hoje é dia de superar você.'}</Title>
      <Text style={styles.subtitle}>{active ? `${active.completedRounds} voltas registradas. Seu tempo está salvo.` : 'Escolha seu ritmo. O resto é uma volta de cada vez.'}</Text>
      {active ? <Pressable accessibilityRole="button" onPress={() => router.push('/workout/active')} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}><Text style={styles.startGlyph}>▶</Text><View style={styles.startWords}><Text style={styles.startTitle}>RETOMAR TREINO</Text><Text style={styles.startHint}>VOLTAR À SESSÃO ATIVA</Text></View><Text style={styles.startArrow}>↗</Text></Pressable> : <>
        <View style={styles.presets}>{(['classic', 'beginner'] as const).map((id) => {
          const selected = presetId === id;
          const option = getPreset(id);
          return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} key={id} onPress={() => selectPreset(id)} style={[styles.preset, selected && styles.presetSelected]}><Text style={[styles.presetTitle, selected && styles.presetTitleSelected]}>{id === 'classic' ? 'CLÁSSICA' : 'INICIANTE'}</Text><Text style={[styles.presetMeta, selected && styles.presetMetaSelected]}>{option.durationMinutes} MIN · AMRAP</Text></Pressable>;
        })}</View>
        <View style={styles.quickRow}><Text style={styles.quickLabel}>DURAÇÃO</Text><View style={styles.duration}><Pressable accessibilityRole="button" accessibilityLabel="Diminuir duração" onPress={() => setDuration((value) => Math.max(1, value - 1))} style={styles.adjust}><Text style={styles.adjustText}>−</Text></Pressable><Text style={styles.durationValue}>{duration}<Text style={styles.durationUnit}> min</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="Aumentar duração" onPress={() => setDuration((value) => Math.min(60, value + 1))} style={styles.adjust}><Text style={styles.adjustText}>+</Text></Pressable></View></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: advanced }} onPress={() => setAdvanced((value) => !value)} style={styles.advancedToggle}><Text style={styles.advancedText}>{advanced ? '−  OCULTAR AJUSTES AVANÇADOS' : '+  PERSONALIZAR MOVIMENTOS'}</Text><Text style={styles.advancedArrow}>{advanced ? '⌃' : '⌄'}</Text></Pressable>
        {advanced && <View style={styles.advancedPanel}>{movements.map((movement, index) => <Pressable key={movement.group} onPress={() => changeMovement(index)} style={styles.movement}><Text style={styles.movementReps}>{movement.reps}</Text><Text style={styles.movementName}>{movement.label}</Text><Text style={styles.change}>ALTERAR ↻</Text></Pressable>)}<Text style={styles.roundMeta}>{repsPerRound({ movements })} repetições por volta</Text></View>}
        <Pressable accessibilityRole="button" disabled={starting} onPress={() => void start()} style={({ pressed }) => [styles.startButton, pressed && styles.pressed, starting && styles.loading]}><Text style={styles.startGlyph}>▶</Text><View style={styles.startWords}><Text style={styles.startTitle}>{starting ? 'PREPARANDO…' : 'COMEÇAR TREINO'}</Text><Text style={styles.startHint}>{preset.name.toUpperCase()} · {duration} MIN</Text></View><Text style={styles.startArrow}>↗</Text></Pressable>
      </>}
    </View>
    <View style={styles.statsHeader}><Label>SUA CONSISTÊNCIA</Label><Text style={styles.statsSub}>CADA SESSÃO CONTA</Text></View>
    <View style={styles.stats}><Card style={{ flex: 1 }}><Text style={styles.statValue}>{streak}<Text style={styles.statUnit}> dias</Text></Text><Text style={styles.statLabel}>SEQUÊNCIA</Text></Card><Card style={{ flex: 1 }}><Text style={styles.statValue}>{weekSessions}<Text style={styles.statUnit}>x</Text></Text><Text style={styles.statLabel}>ESTA SEMANA</Text></Card></View>
    {sessions.length > 0 && <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/progress')} style={styles.historyLink}><Text style={styles.historyText}>ACOMPANHAR EVOLUÇÃO</Text><Text style={styles.historyArrow}>↗</Text></Pressable>}
    <Text style={styles.notice}>Treine no seu ritmo. Pare se sentir dor ou desconforto.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }, brand: { color: colors.text, fontSize: 26, lineHeight: 28, fontWeight: '900', letterSpacing: -1.5 }, brandDot: { color: colors.lime }, tagline: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 }, offline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 99 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, offlineText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  hero: { position: 'relative', overflow: 'hidden', marginTop: 4, padding: 18, borderRadius: 22, backgroundColor: '#121812', borderWidth: 1, borderColor: '#34402D', gap: 10 }, slashOne: { position: 'absolute', width: 92, height: 2, backgroundColor: '#283622', top: 26, right: -13, transform: [{ rotate: '-48deg' }] }, slashTwo: { position: 'absolute', width: 80, height: 2, backgroundColor: '#283622', top: 39, right: -12, transform: [{ rotate: '-48deg' }] }, eyebrow: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 }, subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 }, presets: { flexDirection: 'row', gap: 8, marginTop: 2 }, preset: { flex: 1, paddingVertical: 10, paddingHorizontal: 11, borderRadius: 13, backgroundColor: '#0D110D', borderColor: colors.line, borderWidth: 1 }, presetSelected: { backgroundColor: '#283A1B', borderColor: colors.lime }, presetTitle: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }, presetTitleSelected: { color: colors.lime }, presetMeta: { color: '#76806F', fontSize: 8, fontWeight: '800', marginTop: 4, letterSpacing: 0.8 }, presetMetaSelected: { color: '#C5D99F' }, quickRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, quickLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, duration: { flexDirection: 'row', alignItems: 'center', gap: 10 }, adjust: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#20291B', alignItems: 'center', justifyContent: 'center' }, adjustText: { color: colors.lime, fontSize: 18, fontWeight: '900', marginTop: -2 }, durationValue: { color: colors.text, fontSize: 15, fontWeight: '900', minWidth: 54, textAlign: 'center' }, durationUnit: { color: colors.muted, fontSize: 10 }, advancedToggle: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 7 }, advancedText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, advancedArrow: { color: colors.lime, fontSize: 14 }, advancedPanel: { backgroundColor: '#0D110D', borderRadius: 12, paddingHorizontal: 10, paddingTop: 2, paddingBottom: 8 }, movement: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, movementReps: { color: colors.lime, width: 24, fontWeight: '900' }, movementName: { color: colors.text, fontSize: 10, fontWeight: '700', flex: 1 }, change: { color: colors.muted, fontSize: 8, fontWeight: '900' }, roundMeta: { color: colors.muted, fontSize: 8, marginTop: 6 },
  startButton: { minHeight: 55, borderRadius: 14, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginTop: 1, borderBottomWidth: 4, borderBottomColor: '#799E22' }, pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 }, loading: { opacity: 0.65 }, startGlyph: { color: colors.ink, fontSize: 14, marginRight: 12 }, startWords: { flex: 1 }, startTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }, startHint: { color: '#35451C', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 3 }, startArrow: { color: colors.ink, fontSize: 18, fontWeight: '900' }, statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, statsSub: { color: '#65705F', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, stats: { flexDirection: 'row', gap: 9 }, statValue: { color: colors.text, fontSize: 26, lineHeight: 30, fontWeight: '900' }, statUnit: { color: colors.lime, fontSize: 10 }, statLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, historyLink: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }, historyText: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, historyArrow: { color: colors.lime, fontSize: 15 }, notice: { color: '#70796B', textAlign: 'center', fontSize: 9, lineHeight: 14 },
});

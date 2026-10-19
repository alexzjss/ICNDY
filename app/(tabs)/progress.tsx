import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Label, Screen, Title } from '../../src/components/ui';
import { SessionCard } from '../../src/components/SessionCard';
import { useApp } from '../../src/context/AppContext';
import { getAchievements } from '../../src/domain/achievements';
import { calculateStreaks } from '../../src/domain/streaks';
import { colors } from '../../src/theme';
import { classifyCalendarDay } from '../../src/domain/calendar';
import { personalBests, completedSessions } from '../../src/domain/records';
import { getInsights } from '../../src/domain/insights';
import { formatLocalDate, localDate } from '../../src/domain/dates';
import { volumeByDay } from '../../src/domain/volume';

const monthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export default function ProgressScreen() {
  const { sessions, schedule } = useApp();
  const [view, setView] = useState<'summary' | 'sessions'>('summary');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const completed = completedSessions(sessions);
  const today = localDate();
  const streaks = calculateStreaks(sessions, schedule, today);
  const achievements = getAchievements(sessions, streaks.best);
  const bests = personalBests(sessions);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = monthStart.getDay();
  const points = volumeByDay(sessions, period);
  const maxVolume = Math.max(...points.map((point) => point.totalReps), 0);
  const changeMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return <Screen>
    <View style={styles.heading}><View><Label>SEU HISTÓRICO DE TREINO</Label><Title size={30}>Evolução.</Title></View><Text style={styles.headingMark}>↗</Text></View>
    <View style={styles.segment}><Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'summary' }} onPress={() => setView('summary')} style={[styles.segmentButton, view === 'summary' && styles.segmentActive]}><Text style={[styles.segmentText, view === 'summary' && styles.segmentTextActive]}>RESUMO</Text></Pressable><Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'sessions' }} onPress={() => setView('sessions')} style={[styles.segmentButton, view === 'sessions' && styles.segmentActive]}><Text style={[styles.segmentText, view === 'sessions' && styles.segmentTextActive]}>TREINOS <Text style={styles.count}>{completed.length}</Text></Text></Pressable></View>

    {view === 'sessions' ? <View style={styles.sessionsList}>{completed.map((session) => <SessionCard key={session.id} session={session} />)}{completed.length === 0 && <Card><Text style={styles.emptyTitle}>Seu primeiro treino ainda está por vir.</Text><Text style={styles.meta}>Depois de concluir uma sessão, ela aparece aqui.</Text></Card>}</View> : <>
      <Card style={styles.statCard}><View style={styles.stats}><View><Text style={styles.statValue}>{streaks.best}<Text style={styles.statUnit}> dias</Text></Text><Text style={styles.statLabel}>MELHOR SEQUÊNCIA</Text></View><View><Text style={styles.statValue}>{completed.length}</Text><Text style={styles.statLabel}>TREINOS FEITOS</Text></View><View><Text style={styles.statValue}>{bests.length}</Text><Text style={styles.statLabel}>RECORDES</Text></View></View></Card>
      <Card style={styles.calendarCard}>
        <View style={styles.calendarHeader}><Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" hitSlop={8} onPress={() => changeMonth(-1)}><Text style={styles.nav}>‹</Text></Pressable><Text style={styles.month}>{monthName(month)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" hitSlop={8} onPress={() => changeMonth(1)}><Text style={styles.nav}>›</Text></Pressable></View>
        <View style={styles.weekdays}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}</View>
        <View style={styles.calendar}>{Array.from({ length: offset + days }, (_, index) => {
          if (index < offset) return <View key={`vazio-${index}`} style={styles.calendarCell} />;
          const day = index - offset + 1;
          const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const state = classifyCalendarDay(date, sessions, schedule, today);
          return <View key={date} style={styles.calendarCell}><View style={[styles.dayDot, state === 'trained' && styles.trained, state === 'missed' && styles.missed, state === 'planned' && styles.planned, state === 'unknown' && styles.unknown]}><Text style={[styles.dayNumber, state === 'trained' && styles.trainedNumber]}>{day}</Text></View></View>;
        })}</View>
        <View style={styles.legend}><View style={styles.legendItem}><View style={styles.legendTrained} /><Text style={styles.legendText}>Treino</Text></View><View style={styles.legendItem}><View style={styles.legendPlanned} /><Text style={styles.legendText}>Planejado</Text></View><View style={styles.legendItem}><View style={styles.legendMissed} /><Text style={styles.legendText}>Não feito</Text></View><View style={styles.legendItem}><View style={styles.legendRest} /><Text style={styles.legendText}>Descanso</Text></View></View>
      </Card>

      <View style={styles.sectionHead}><Label>VOLUME DE REPETIÇÕES</Label><View style={styles.periods}>{([7, 30, 90] as const).map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: period === value }} key={value} onPress={() => setPeriod(value)} style={[styles.period, period === value && styles.periodSelected]}><Text style={[styles.periodText, period === value && styles.periodTextSelected]}>{value}d</Text></Pressable>)}</View></View>
      {completed.length === 0 ? <Card><Text style={styles.meta}>Seus dados de volume aparecerão depois do primeiro treino.</Text></Card> : <View style={styles.chart}>{points.map((point) => <View key={point.date} style={styles.chartColumn}><View style={styles.barTrack}><View style={[styles.bar, { height: point.totalReps ? `${Math.max(8, (point.totalReps / maxVolume) * 100)}%` : '0%' }]} /></View>{(period <= 30 && point.date.endsWith('-01')) || period === 7 ? <Text style={styles.chartLabel}>{formatLocalDate(point.date, { month: 'short', day: 'numeric' })}</Text> : null}</View>)}</View>}

      {bests.length > 0 && <><View style={styles.sectionHead}><Label>MELHOR RESULTADO</Label></View><Card accent><Text style={styles.bestName}>{bests[0].presetId === 'classic' ? 'Cindy Clássica' : 'Cindy Iniciante'}</Text><Text style={styles.bestScore}>{bests[0].completedRounds} <Text style={styles.bestPlus}>+ {bests[0].additionalReps}</Text></Text><Text style={styles.meta}>{bests[0].totalReps} repetições · {formatLocalDate(bests[0].localDate, { day: 'numeric', month: 'long', year: 'numeric' })}</Text></Card></>}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.detailsToggle}><Text style={styles.detailsTitle}>CONQUISTAS E INSIGHTS</Text><Text style={styles.detailsIcon}>{detailsOpen ? '−' : '+'}</Text></Pressable>
      {detailsOpen && <View style={styles.details}>{achievements.map((achievement) => <View key={achievement.id} style={[styles.achievement, !achievement.earned && styles.locked]}><Text style={styles.achievementIcon}>{achievement.earned ? '◆' : '◇'}</Text><View style={styles.achievementWords}><Text style={styles.achievementName}>{achievement.label}</Text><Text style={styles.meta}>{achievement.detail}</Text></View></View>)}{getInsights(sessions).slice(0, 3).map((insight) => <View key={insight.title} style={styles.insight}><Text style={styles.insightTitle}>{insight.title}</Text><Text style={styles.meta}>{insight.detail}</Text></View>)}</View>}
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headingMark: { color: colors.lime, fontSize: 26, fontWeight: '900' }, segment: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, segmentButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, segmentActive: { backgroundColor: colors.lime }, segmentText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, segmentTextActive: { color: colors.ink }, count: { color: colors.lime, fontSize: 8 }, sessionsList: { gap: 10 }, emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  statCard: { paddingVertical: 13 }, stats: { flexDirection: 'row', justifyContent: 'space-between' }, statValue: { color: colors.lime, fontSize: 24, fontWeight: '900' }, statUnit: { color: colors.muted, fontSize: 9 }, statLabel: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 }, calendarCard: { paddingVertical: 12, gap: 5 }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, month: { color: colors.text, fontWeight: '900', fontSize: 12, textTransform: 'capitalize' }, nav: { color: colors.lime, fontSize: 25, paddingHorizontal: 10 }, weekdays: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 }, weekday: { color: colors.muted, fontSize: 9, fontWeight: '800', width: 28, textAlign: 'center' }, calendar: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }, calendarCell: { width: '14.285%', height: 30, alignItems: 'center', justifyContent: 'center' }, dayDot: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, trained: { backgroundColor: colors.lime }, trainedNumber: { color: colors.ink }, missed: { borderWidth: 1, borderColor: colors.danger }, planned: { borderWidth: 1, borderColor: colors.muted }, unknown: { borderWidth: 1, borderColor: colors.line, borderStyle: 'dotted' }, dayNumber: { color: colors.text, fontSize: 10, fontWeight: '700' }, legend: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginTop: 4 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendTrained: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lime }, legendPlanned: { width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.muted }, legendMissed: { width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.danger }, legendRest: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.surfaceRaised }, legendText: { color: colors.muted, fontSize: 8 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, periods: { flexDirection: 'row', gap: 4 }, period: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.surfaceRaised }, periodSelected: { backgroundColor: colors.lime }, periodText: { color: colors.muted, fontSize: 9, fontWeight: '900' }, periodTextSelected: { color: colors.ink }, chart: { height: 112, flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingTop: 5, marginBottom: 3 }, chartColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }, barTrack: { width: '68%', height: '86%', justifyContent: 'flex-end', backgroundColor: colors.surfaceRaised, borderRadius: 3, overflow: 'hidden' }, bar: { width: '100%', backgroundColor: colors.lime, borderRadius: 3 }, chartLabel: { color: colors.muted, fontSize: 7, position: 'absolute', bottom: -12 }, meta: { color: colors.muted, fontSize: 10, lineHeight: 15 }, bestName: { color: colors.text, fontSize: 12, fontWeight: '900' }, bestScore: { color: colors.lime, fontSize: 30, fontWeight: '900', lineHeight: 34 }, bestPlus: { fontSize: 17, color: colors.text },
  detailsToggle: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line }, detailsTitle: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, detailsIcon: { color: colors.lime, fontSize: 19 }, details: { gap: 8 }, achievement: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line }, locked: { opacity: 0.45 }, achievementIcon: { color: colors.lime, fontSize: 15 }, achievementWords: { flex: 1 }, achievementName: { color: colors.text, fontSize: 11, fontWeight: '900' }, insight: { padding: 11, borderRadius: 12, backgroundColor: colors.surface }, insightTitle: { color: colors.text, fontSize: 11, fontWeight: '800' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { getAchievements } from '../../src/domain/achievements';
import { calculateStreaks } from '../../src/domain/streaks';
import { colors } from '../../src/theme';
import { classifyCalendarDay } from '../../src/domain/calendar';
import { personalBests, completedSessions } from '../../src/domain/records';
import { getInsights } from '../../src/domain/insights';
import { formatLocalDate, localDate } from '../../src/domain/dates';
import { volumeByDay } from '../../src/domain/volume';

const monthName = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export default function ProgressScreen() {
  const { sessions, schedule } = useApp();
  const completed = completedSessions(sessions);
  const today = localDate();
  const streaks = calculateStreaks(sessions, schedule, today);
  const achievements = getAchievements(sessions, streaks.best);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const bests = personalBests(sessions);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = monthStart.getDay();
  const points = volumeByDay(sessions, period);
  const maxVolume = Math.max(...points.map((point) => point.totalReps), 0);
  const changeMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return <Screen>
    <Label>PERFORMANCE / CONSISTENCY</Label><Title>Progress.</Title>
    <Card><View style={styles.metrics}><View><Label>Best streak</Label><Text style={styles.big}>{streaks.best}</Text></View><View><Label>Workouts</Label><Text style={styles.big}>{completed.length}</Text></View><View><Label>Records</Label><Text style={styles.big}>{bests.length}</Text></View></View></Card>
    <Card>
      <View style={styles.calendarHeader}><Pressable accessibilityLabel="Previous month" onPress={() => changeMonth(-1)}><Text style={styles.nav}>‹</Text></Pressable><Text style={styles.month}>{monthName(month)}</Text><Pressable accessibilityLabel="Next month" onPress={() => changeMonth(1)}><Text style={styles.nav}>›</Text></Pressable></View>
      <View style={styles.weekdays}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}</View>
      <View style={styles.calendar}>{Array.from({ length: offset + days }, (_, index) => {
        if (index < offset) return <View key={`empty-${index}`} style={styles.calendarCell} />;
        const day = index - offset + 1;
        const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const state = classifyCalendarDay(date, sessions, schedule, today);
        return <View key={date} style={styles.calendarCell}><View style={[styles.dayDot, state === 'trained' && styles.trained, state === 'missed' && styles.missed, state === 'planned' && styles.planned, state === 'unknown' && styles.unknown]}><Text style={[styles.dayNumber, state === 'trained' && styles.trainedNumber]}>{day}</Text></View></View>;
      })}</View>
      <Text style={styles.legend}>● trained   ○ planned   ◌ missed   · rest   ? no schedule</Text>
    </Card>
    <View style={styles.section}><Label>Personal bests by configuration</Label>
      {bests.map((best) => <Card key={`${best.comparisonKey}-${best.id}`}><Text style={styles.name}>{best.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy'}</Text><Text style={styles.score}>{best.completedRounds} + {best.additionalReps}</Text><Text style={styles.meta}>{best.totalReps} total reps · {formatLocalDate(best.localDate)} · personal best</Text><Text style={styles.meta}>{Math.round(best.durationSeconds / 60)} min · {best.movements.map((movement) => movement.label).join(' · ')}</Text></Card>)}
      {bests.length === 0 && <Card><Text style={styles.meta}>Complete a workout to unlock comparable performance.</Text></Card>}
    </View>
    <View style={styles.section}><View style={styles.sectionHeader}><Label>Real volume</Label><View style={styles.periods}>{([7, 30, 90] as const).map((value) => <Pressable key={value} onPress={() => setPeriod(value)} style={[styles.period, period === value && styles.periodSelected]}><Text style={[styles.periodText, period === value && styles.periodTextSelected]}>{value}d</Text></Pressable>)}</View></View>
      {completed.length === 0 ? <Card><Text style={styles.meta}>Complete a workout to see real volume. No trend is estimated without sessions.</Text></Card> : <View style={styles.chart}>{points.map((point) => <View key={point.date} style={styles.chartColumn}><View style={styles.barTrack}><View style={[styles.bar, { height: point.totalReps ? `${Math.max(8, (point.totalReps / maxVolume) * 100)}%` : '0%' }]} /></View>{(period <= 30 && point.date.endsWith('-01')) || period === 7 ? <Text style={styles.chartLabel}>{formatLocalDate(point.date, { month: 'short', day: 'numeric' })}</Text> : null}</View>)}</View>}
    </View>
    <View style={styles.section}><Label>Personal insights</Label>{getInsights(sessions).map((insight) => <Card key={insight.title}><Text style={styles.name}>{insight.title}</Text><Text style={styles.meta}>{insight.detail}</Text></Card>)}</View>
    <View style={styles.section}><Label>Achievements</Label>{achievements.map((achievement) => <View key={achievement.id} style={[styles.achievement, !achievement.earned && styles.locked]}><Text style={styles.achievementIcon}>{achievement.earned ? '◆' : '○'}</Text><View><Text style={styles.name}>{achievement.label}</Text><Text style={styles.meta}>{achievement.detail}</Text></View></View>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', justifyContent: 'space-between' }, big: { color: colors.lime, fontSize: 30, fontWeight: '900', marginTop: 4 }, section: { gap: 12 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, name: { color: colors.text, fontSize: 16, fontWeight: '800' }, score: { color: colors.lime, fontSize: 26, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12 }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, month: { color: colors.text, fontWeight: '800', textTransform: 'capitalize' }, nav: { color: colors.lime, fontSize: 30, paddingHorizontal: 10 }, weekdays: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }, weekday: { color: colors.muted, fontSize: 11, fontWeight: '800', width: 32, textAlign: 'center' }, calendar: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }, calendarCell: { width: '14.285%', height: 34, alignItems: 'center', justifyContent: 'center' }, dayDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, trained: { backgroundColor: colors.lime }, trainedNumber: { color: colors.ink }, missed: { borderWidth: 1, borderColor: colors.danger }, planned: { borderWidth: 1, borderColor: colors.muted }, unknown: { borderWidth: 1, borderColor: colors.line, borderStyle: 'dotted' }, dayNumber: { color: colors.text, fontSize: 12, fontWeight: '700' }, legend: { color: colors.muted, fontSize: 10, marginTop: 8 }, periods: { flexDirection: 'row', gap: 4 }, period: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceRaised }, periodSelected: { backgroundColor: colors.lime }, periodText: { color: colors.muted, fontSize: 11, fontWeight: '800' }, periodTextSelected: { color: colors.ink }, chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingTop: 8 }, chartColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }, barTrack: { width: '70%', height: '88%', justifyContent: 'flex-end', backgroundColor: colors.surfaceRaised, borderRadius: 3, overflow: 'hidden' }, bar: { width: '100%', backgroundColor: colors.lime, borderRadius: 3 }, chartLabel: { color: colors.muted, fontSize: 8, position: 'absolute', bottom: -14 }, achievement: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderColor: colors.lime, borderWidth: 1 }, locked: { opacity: 0.45, borderColor: colors.line }, achievementIcon: { color: colors.lime, fontSize: 22 },
});

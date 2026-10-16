import { StyleSheet, Text, View } from 'react-native';
import { Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { getAchievements } from '../../src/domain/achievements';
import { calculateStreaks } from '../../src/domain/streaks';
import { colors } from '../../src/theme';
export default function ProgressScreen() {
  const { sessions, schedule } = useApp(); const streaks = calculateStreaks(sessions, schedule, new Date().toISOString().slice(0, 10)); const achievements = getAchievements(sessions, streaks.best);
  const groups = sessions.reduce<Record<string, typeof sessions>>((all, session) => ({ ...all, [session.comparisonKey]: [...(all[session.comparisonKey] ?? []), session] }), {});
  return <Screen><Label>PERFORMANCE / CONSISTENCY</Label><Title>Progress.</Title><Card><View style={styles.metrics}><View><Label>Best streak</Label><Text style={styles.big}>{streaks.best}</Text></View><View><Label>Workouts</Label><Text style={styles.big}>{sessions.length}</Text></View><View><Label>Series</Label><Text style={styles.big}>{Object.keys(groups).length}</Text></View></View></Card>
    <View style={styles.section}><Label>Personal bests by configuration</Label>{Object.values(groups).map((group) => { const best = [...group].sort((a, b) => b.totalReps - a.totalReps)[0]; return <Card key={best.comparisonKey}><Text style={styles.name}>{best.presetId === 'classic' ? 'Classic Cindy' : 'Beginner Cindy'}</Text><Text style={styles.score}>{best.completedRounds} + {best.additionalReps}</Text><Text style={styles.meta}>{group.length} comparable session{group.length === 1 ? '' : 's'}</Text></Card>; })}{sessions.length === 0 && <Card><Text style={styles.meta}>Complete a workout to unlock comparable performance.</Text></Card>}</View>
    <View style={styles.section}><Label>Achievements</Label>{achievements.map((achievement) => <View key={achievement.id} style={[styles.achievement, !achievement.earned && styles.locked]}><Text style={styles.achievementIcon}>{achievement.earned ? '◆' : '○'}</Text><View><Text style={styles.name}>{achievement.label}</Text><Text style={styles.meta}>{achievement.detail}</Text></View></View>)}</View>
  </Screen>;
}
const styles = StyleSheet.create({ metrics: { flexDirection: 'row', justifyContent: 'space-between' }, big: { color: colors.lime, fontSize: 30, fontWeight: '900', marginTop: 4 }, section: { gap: 12 }, name: { color: colors.text, fontSize: 16, fontWeight: '800' }, score: { color: colors.lime, fontSize: 26, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12 }, achievement: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderColor: colors.lime, borderWidth: 1 }, locked: { opacity: 0.45, borderColor: colors.line }, achievementIcon: { color: colors.lime, fontSize: 22 } });

import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedNumber, Card, Label, SegmentedControl, Text } from '../../components';
import { addDays, localDateString, weekdayOf } from '../../domain/dates';
import type { MovementKey, WorkoutSession } from '../../domain/models';
import { nextMilestone, volumeTotals } from '../../domain/volume';
import { colors, fonts, movementColors, withAlpha } from '../../theme';

type Period = 'life' | 'month' | 'week';
const OPTIONS: { value: Period; label: string }[] = [
  { value: 'life', label: 'Vida' },
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
];
const GROUPS: { key: MovementKey; label: string }[] = [
  { key: 'pull', label: 'Puxadas' },
  { key: 'push', label: 'Flexões' },
  { key: 'squat', label: 'Agachamentos' },
];

const formatInt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const periodRange = (period: Period, today: string): [string | undefined, string | undefined] => {
  if (period === 'life') return [undefined, undefined];
  if (period === 'month') return [`${today.slice(0, 8)}01`, undefined];
  return [addDays(today, -((weekdayOf(today) + 6) % 7)), undefined]; // semana começa na segunda
};

const ProgressBar = ({ fraction, color }: { fraction: number; color: string }) => {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, fraction));
    p.value = reduced ? target : withTiming(target, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [fraction, reduced, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fill]} />
    </View>
  );
};

/** Volume acumulado (reps) por movimento, com progresso até o próximo marco. */
export const VolumeCard = ({ sessions }: { sessions: WorkoutSession[] }) => {
  const [period, setPeriod] = useState<Period>('life');
  const today = localDateString();
  const totals = useMemo(() => {
    const [from, to] = periodRange(period, today);
    return volumeTotals(sessions, from, to);
  }, [sessions, period, today]);

  return (
    <Card>
      <Label>Volume acumulado</Label>
      <SegmentedControl options={OPTIONS} value={period} onChange={setPeriod} />
      <View style={styles.rows}>
        {GROUPS.map(({ key, label }) => {
          const total = totals[key];
          const next = nextMilestone(total);
          const color = movementColors[key];
          return (
            <View key={key} style={styles.row} accessible accessibilityLabel={`${label}: ${total} repetições, faltam ${next - total} para ${next}`}>
              <View style={styles.head}>
                <Text variant="heading" color={color}>{label}</Text>
                <AnimatedNumber value={total} fontSize={32} duration={400} animateOnMount={false} color={colors.text} style={styles.number} />
              </View>
              <ProgressBar fraction={total / next} color={color} />
              <Text variant="caption">{`faltam ${formatInt(next - total)} para ${formatInt(next)}`}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  rows: { gap: 16, marginTop: 6 },
  row: { gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fonts.displayBold, textAlign: 'right', minWidth: 90 },
  track: { height: 6, borderRadius: 3, backgroundColor: withAlpha('#FFFFFF', 0.08), overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

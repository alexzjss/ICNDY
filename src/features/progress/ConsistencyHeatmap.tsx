import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { Text } from '../../components';
import { SchedulePeriod, WorkoutSession } from '../../domain/models';
import { colors, withAlpha } from '../../theme';
import { buildHeatmap, HeatCell } from './data';

const WEEKS = 16;
const GAP = 4;
const LABEL_W = 14;
const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const cellStyle = (cell: HeatCell, size: number) => {
  const base = { width: size, height: size, borderRadius: Math.max(3, size / 4) };
  switch (cell.state) {
    case 'done':
      return { ...base, backgroundColor: colors.accent };
    case 'missed':
      return { ...base, backgroundColor: withAlpha(colors.danger, 0.22), borderWidth: 1, borderColor: withAlpha(colors.danger, 0.55) };
    case 'rest':
      return { ...base, backgroundColor: colors.surfaceRaised };
    default:
      return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: withAlpha(colors.line, 0.5), borderStyle: 'dashed' as const };
  }
};

const LegendItem = ({ style, label }: { style: object; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, style]} />
    <Text variant="caption">{label}</Text>
  </View>
);

type Props = { sessions: WorkoutSession[]; schedule: SchedulePeriod[]; today: string };

/** Calendário de consistência: ~16 semanas em colunas (dom-sáb). */
export const ConsistencyHeatmap = ({ sessions, schedule, today }: Props) => {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const grid = useMemo(() => buildHeatmap(today, WEEKS, sessions, schedule), [today, sessions, schedule]);
  const size = width > 0 ? Math.min(22, Math.floor((width - LABEL_W - GAP * WEEKS) / WEEKS)) : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const totalDone = grid.flat().filter((c) => c.state === 'done').length;

  return (
    <View onLayout={onLayout} style={styles.root}>
      {size > 0 ? (
        <View style={styles.grid} accessible accessibilityLabel={`Calendário de consistência: ${totalDone} treinos nas últimas ${WEEKS} semanas`}>
          <View style={styles.labels}>
            {LETTERS.map((l, i) => (
              <View key={i} style={{ height: size, justifyContent: 'center' }}>
                <Text variant="caption" style={styles.letter}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={styles.columns}>
            {grid.map((col, c) => (
              <View key={col[0].date} style={styles.column}>
                {col.map((cell, r) => (
                  <Animated.View
                    key={cell.date}
                    entering={reduced ? undefined : FadeIn.delay(c * 35 + r * 12).duration(260)}
                    style={[cellStyle(cell, size), cell.isToday && styles.today]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.legend}>
        <LegendItem style={{ backgroundColor: colors.accent }} label="Feito" />
        <LegendItem style={{ backgroundColor: withAlpha(colors.danger, 0.22), borderWidth: 1, borderColor: withAlpha(colors.danger, 0.55) }} label="Perdido" />
        <LegendItem style={{ backgroundColor: colors.surfaceRaised }} label="Descanso" />
        <LegendItem style={{ borderWidth: 1.5, borderColor: colors.text }} label="Hoje" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 12 },
  grid: { flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  labels: { width: LABEL_W, gap: GAP },
  letter: { fontSize: 10, lineHeight: 12, textAlign: 'center' },
  columns: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  column: { gap: GAP },
  today: { borderWidth: 1.5, borderColor: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4 },
});

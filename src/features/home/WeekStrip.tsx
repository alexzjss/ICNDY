import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Card, Text } from '../../components';
import { colors, fonts, withAlpha } from '../../theme';
import { WEEKDAY_NAMES, WeekDay } from './logic';

const SIZE = 38;

const Dot = ({ day, index }: { day: WeekDay; index: number }) => {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);
  const pending = day.state === 'today';

  useEffect(() => {
    if (reduced) return;
    pop.value = withDelay(Math.min(index, 6) * 25, withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }));
  }, [reduced, index, pop]);

  const style = useAnimatedStyle(() => ({ opacity: pop.value }));

  const done = day.state === 'done' || day.state === 'todayDone';
  let body;
  if (done) {
    body = (
      <View style={[styles.dot, { backgroundColor: colors.accent }]}>
        <Ionicons name="checkmark" size={22} color={colors.onAccent} />
      </View>
    );
  } else if (day.state === 'today') {
    body = (
      <View style={[styles.dot, { borderColor: colors.accent, borderWidth: 2, backgroundColor: withAlpha(colors.accent, 0.12) }]}>
        <Ionicons name="play" size={14} color={colors.accent} />
      </View>
    );
  } else if (day.state === 'planned') {
    body = <View style={[styles.dot, { borderColor: withAlpha(colors.accent, 0.5), borderWidth: 1.5, borderStyle: 'dashed' }]} />;
  } else if (day.state === 'missed') {
    body = (
      <View style={[styles.dot, { backgroundColor: withAlpha(colors.danger, 0.14), borderColor: withAlpha(colors.danger, 0.4), borderWidth: 1 }]}>
        <Ionicons name="close" size={18} color={colors.danger} />
      </View>
    );
  } else {
    body = (
      <View style={[styles.dot, { backgroundColor: colors.surfaceRaised, width: SIZE - 10, height: SIZE - 10, borderRadius: (SIZE - 10) / 2, marginVertical: 5 }]} />
    );
  }

  return (
    <View style={styles.cell} accessible accessibilityLabel={`${WEEKDAY_NAMES[day.weekday]}${day.isToday ? ', hoje' : ''}: ${done ? 'treino feito' : day.state === 'missed' ? 'perdido' : day.planned ? 'planejado' : 'descanso'}`}>
      <Text variant="caption" color={day.isToday ? colors.text : colors.muted} style={styles.letter}>{day.letter}</Text>
      <Animated.View style={[styles.wrap, style]}>
        {pending ? <View style={styles.ring} /> : null}
        {body}
      </Animated.View>
    </View>
  );
};

/** Semana atual (D S T Q Q S S) com o estado de cada dia. */
export const WeekStrip = ({ week }: { week: WeekDay[] }) => {
  const planned = week.filter((d) => d.planned).length;
  const done = week.filter((d) => d.done && d.planned).length;
  return (
    <Card>
      <View style={styles.head}>
        <Text variant="label">Esta semana</Text>
        {planned > 0 ? (
          <Text variant="caption">
            {done} de {planned} planejados
          </Text>
        ) : (
          <Text variant="caption">Sem dias planejados</Text>
        )}
      </View>
      <View style={styles.row}>
        {week.map((day, index) => (
          <Dot key={day.date} day={day} index={index} />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cell: { alignItems: 'center', gap: 6, flex: 1 },
  letter: { fontFamily: fonts.bodySemibold },
  wrap: { width: SIZE + 8, height: SIZE + 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: withAlpha(colors.accent, 0.5) },
});

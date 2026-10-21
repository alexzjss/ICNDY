import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '../../components';
import { roundDurations, splitStats } from '../../domain/splits';
import { colors, roundColor } from '../../theme';
import { formatDuration } from './format';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const HEIGHT = 150;
const PAD_TOP = 8;

type BarProps = { x: number; width: number; fullHeight: number; fill: string; index: number; opacity: number };

const Bar = ({ x, width, fullHeight, fill, index, opacity }: BarProps) => {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? 1 : withDelay(Math.min(index * 35, 700), withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [p, reduced, index]);
  const props = useAnimatedProps(() => {
    const h = fullHeight * p.value;
    return { y: PAD_TOP + HEIGHT - h, height: h };
  });
  return <AnimatedRect x={x} width={width} rx={Math.min(4, width / 2)} fill={fill} opacity={opacity} animatedProps={props} />;
};

export type SplitsChartProps = {
  /** Tempos acumulados (roundSplitsMs). */
  splits: number[];
};

/** Barras por round (duração de cada round) com destaque do melhor/pior e linha da média. */
export const SplitsChart = ({ splits }: SplitsChartProps) => {
  const [width, setWidth] = useState(0);
  const durations = roundDurations(splits);
  const stats = splitStats(splits);
  if (!stats) {
    return <Text variant="caption">Sem tempos por round registrados neste treino.</Text>;
  }
  const max = Math.max(...durations, 1);
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const gap = durations.length > 20 ? 2 : 5;
  const barW = width > 0 ? Math.max(2, (width - gap * (durations.length - 1)) / durations.length) : 0;
  const avgY = PAD_TOP + HEIGHT - (avg / max) * HEIGHT;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrap}>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT + PAD_TOP}>
            {durations.map((d, i) => {
              const special = i === stats.bestIndex ? colors.success : i === stats.worstIndex ? colors.danger : undefined;
              return (
                <Bar
                  key={i}
                  index={i}
                  x={i * (barW + gap)}
                  width={barW}
                  fullHeight={Math.max(3, (d / max) * HEIGHT)}
                  fill={special ?? roundColor(i)}
                  opacity={special ? 1 : 0.75}
                />
              );
            })}
            <Line x1={0} x2={width} y1={avgY} y2={avgY} stroke={colors.text} strokeOpacity={0.7} strokeWidth={1} strokeDasharray="4 4" />
          </Svg>
        ) : (
          <View style={{ height: HEIGHT + PAD_TOP }} />
        )}
      </View>
      <View style={styles.legend}>
        <Legend color={colors.success} label="Melhor" value={`R${stats.bestIndex + 1} · ${formatDuration(stats.bestMs)}`} />
        <Legend color={colors.danger} label="Pior" value={`R${stats.worstIndex + 1} · ${formatDuration(stats.worstMs)}`} />
        <Legend color={colors.text} label="Média" value={formatDuration(avg)} />
      </View>
    </View>
  );
};

const Legend = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <View>
      <Text variant="label">{label}</Text>
      <Text variant="body" style={styles.legendValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendValue: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});

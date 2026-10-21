import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Chip, SPRING, Text } from '../../components';
import { formatDayMonth } from '../../domain/dates';
import { WorkoutSession } from '../../domain/models';
import { colors } from '../../theme';
import { areaPath, buildPoints, linePath, polylineLength } from './chartMath';
import { evolutionOptions, EvolutionPoint, evolutionPoints, prIndex } from './data';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HEIGHT = 200;
const PAD = { left: 38, right: 16, top: 24, bottom: 12 };
const AXIS_H = 20;

const Dot = ({ x, y, index, total, isPr }: { x: number; y: number; index: number; total: number; isPr: boolean }) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    scale.value = withDelay(200 + (total <= 1 ? 0 : (index / (total - 1)) * 900), withSpring(1, SPRING));
  }, [reduced, index, total, scale]);
  const props = useAnimatedProps(() => ({ r: (isPr ? 6 : 4) * scale.value }));
  return <AnimatedCircle cx={x} cy={y} fill={isPr ? colors.accent : colors.bg} stroke={colors.accent} strokeWidth={2} animatedProps={props} />;
};

const PrHalo = ({ x, y }: { x: number; y: number }) => {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(1100, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1));
  }, [reduced, p]);
  const props = useAnimatedProps(() => ({ r: 6 + p.value * 12, opacity: reduced ? 0 : (1 - p.value) * 0.6 }));
  return <AnimatedCircle cx={x} cy={y} fill="none" stroke={colors.accent} strokeWidth={2} animatedProps={props} />;
};

type BodyProps = { points: EvolutionPoint[]; width: number };

const ChartBody = ({ points, width }: BodyProps) => {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const values = useMemo(() => points.map((p) => p.totalReps), [points]);
  const plotH = HEIGHT - AXIS_H;
  const coords = useMemo(() => buildPoints(values, width, plotH, PAD), [values, width, plotH]);
  const length = Math.max(1, polylineLength(coords));
  const pr = prIndex(points);
  const min = Math.min(...values);
  const max = Math.max(...values);

  useEffect(() => {
    if (reduced) return;
    progress.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [reduced, progress]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  const areaProps = useAnimatedProps(() => ({ opacity: progress.value }));

  const base = plotH - PAD.bottom;
  const labelIdx = points.length <= 1 ? [0] : points.length === 2 ? [0, 1] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const gridValues = max === min ? [max] : [max, Math.round((max + min) / 2), min];
  const gridYs = max === min ? [plotH / 2] : [PAD.top, PAD.top + (plotH - PAD.top - PAD.bottom) / 2, plotH - PAD.bottom];

  return (
    <View style={{ height: HEIGHT }}>
      <Svg width={width} height={plotH}>
        <Defs>
          <LinearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.accentAlt} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="evoLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accentAlt} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        {gridYs.map((y, i) => (
          <Line key={i} x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} stroke={colors.line} strokeWidth={1} strokeDasharray="4 6" />
        ))}
        {coords.length > 1 ? (
          <>
            <AnimatedPath d={areaPath(coords, base)} fill="url(#evoFill)" animatedProps={areaProps} />
            <AnimatedPath
              d={linePath(coords)}
              stroke="url(#evoLine)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={length}
              animatedProps={lineProps}
            />
          </>
        ) : null}
        {pr >= 0 && coords.length > 1 ? <PrHalo x={coords[pr].x} y={coords[pr].y} /> : null}
        {coords.map((c, i) => (
          <Dot key={points[i].id} x={c.x} y={c.y} index={i} total={coords.length} isPr={i === pr} />
        ))}
      </Svg>
      {gridValues.map((v, i) => (
        <Text key={i} variant="caption" style={[styles.yLabel, { top: gridYs[i] - 8 }]}>
          {v}
        </Text>
      ))}
      {pr >= 0 ? (
        <View pointerEvents="none" style={[styles.prTag, { left: Math.min(Math.max(coords[pr].x - 28, PAD.left - 4), width - 64), top: Math.max(0, coords[pr].y - 28) }]}>
          <Text variant="label" color={colors.onAccent} style={styles.prText}>PR {points[pr].totalReps}</Text>
        </View>
      ) : null}
      <View style={styles.axis}>
        {labelIdx.map((i, k) => {
          const x = coords[i]?.x ?? 0;
          const align = k === 0 && labelIdx.length > 1 ? 'left' : k === labelIdx.length - 1 && labelIdx.length > 1 ? 'right' : 'center';
          const w = 64;
          const left = align === 'left' ? Math.max(0, x - 8) : align === 'right' ? x - w + 8 : x - w / 2;
          return (
            <Text key={i} variant="caption" align={align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'} style={{ position: 'absolute', width: w, left, top: 2 }}>
              {formatDayMonth(points[i].date).split(', ')[1]}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

type Props = { sessions: WorkoutSession[] };

/** Evolução do total de reps ao longo do tempo, filtrável por configuração. */
export const EvolutionChart = ({ sessions }: Props) => {
  const options = useMemo(() => evolutionOptions(sessions), [sessions]);
  const [selected, setSelected] = useState<string>();
  const [width, setWidth] = useState(0);
  const key = options.find((o) => o.key === selected)?.key ?? options[0]?.key;
  const points = useMemo(() => (key ? evolutionPoints(sessions, key) : []), [sessions, key]);
  const current = options.find((o) => o.key === key);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (options.length === 0) {
    return (
      <Text variant="body" color={colors.muted} align="center" style={styles.empty}>
        Conclua um treino para ver sua evolução aqui.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      {options.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {options.map((o) => (
            <Chip key={o.key} label={`${o.label} · ${o.detail.split(' · ')[0]}`} color={colors.accent} selected={o.key === key} onPress={() => setSelected(o.key)} />
          ))}
        </ScrollView>
      ) : null}
      {current ? <Text variant="caption">{current.detail} · {points.length === 1 ? '1 treino' : `${points.length} treinos`}</Text> : null}
      <View onLayout={onLayout}>
        {width > 0 && points.length > 0 ? <ChartBody key={key} points={points} width={width} /> : null}
      </View>
      {points.length === 1 ? (
        <Text variant="caption" align="center" color={colors.accent}>
          Faça mais um treino nesta configuração para ver a linha de evolução.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 10 },
  chips: { gap: 8, paddingRight: 8 },
  empty: { paddingVertical: 24 },
  yLabel: { position: 'absolute', left: 0, width: PAD.left - 6, textAlign: 'right' },
  prTag: { position: 'absolute', backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  prText: { fontSize: 11, lineHeight: 15 },
  axis: { height: AXIS_H, marginTop: 0 },
});


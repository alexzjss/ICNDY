import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { MovementOption } from '../../domain/models';
import { formatRemaining, remainingMs, TimerState } from '../../domain/timer';
import { colors, fonts, movementColors, withAlpha } from '../../theme';

/** Texto do relógio regressivo; atualiza sozinho (somente este componente re-renderiza no tick). */
const useClockText = (timer: TimerState) => {
  const { durationMs, startedAtMs, pausedAtMs, pausedDurationMs, elapsedBeforePauseMs } = timer;
  const [text, setText] = useState(() => formatRemaining(remainingMs(timer, Date.now())));
  useEffect(() => {
    const state: TimerState = { durationMs, startedAtMs, pausedAtMs, pausedDurationMs, elapsedBeforePauseMs };
    const tick = () => {
      const next = formatRemaining(remainingMs(state, Date.now()));
      setText((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [durationMs, startedAtMs, pausedAtMs, pausedDurationMs, elapsedBeforePauseMs]);
  return text;
};

export type HudProps = {
  /** 'light' = fora do líquido (texto claro); 'dark' = dentro (texto escuro). */
  tone: 'light' | 'dark';
  timer: TimerState;
  completedRounds: number;
  movements: MovementOption[];
  pop: SharedValue<number>;
};

/** Relógio gigante + "ROUND N" + sequência de movimentos. Renderizado em duas camadas (claro/escuro). */
export const Hud = memo(({ tone, timer, completedRounds, movements, pop }: HudProps) => {
  const { width } = useWindowDimensions();
  const text = useClockText(timer);
  const dark = tone === 'dark';
  const fg = dark ? colors.bg : colors.text;
  const sub = dark ? withAlpha(colors.bg, 0.7) : colors.muted;
  // Barlow Condensed: "00:00" ocupa ~2,3em; adjustsFontSizeToFit garante que caiba em telas estreitas.
  const size = Math.min((width - 32) / 2.3, 220);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Text style={[styles.clock, { fontSize: size, lineHeight: size * 0.95, color: fg, width: width - 32 }]} numberOfLines={1} adjustsFontSizeToFit>
        {text}
      </Text>
      <Animated.View style={[styles.roundRow, popStyle]}>
        <Text style={[styles.roundLabel, { color: sub }]}>ROUND</Text>
        <Text style={[styles.roundNumber, { color: fg }]}>{completedRounds + 1}</Text>
      </Animated.View>
      <View style={styles.moves}>
        {movements.map((movement, index) => {
          const color = dark ? colors.bg : movementColors[movement.group];
          return (
            <View key={`${movement.key}-${index}`} style={[styles.move, { backgroundColor: dark ? withAlpha(colors.bg, 0.14) : withAlpha(color, 0.16), borderColor: dark ? withAlpha(colors.bg, 0.35) : withAlpha(color, 0.5) }]}>
              <Text style={[styles.moveReps, { color }]}>{movement.reps}</Text>
              <Text style={[styles.moveName, { color: dark ? colors.bg : colors.text }]} numberOfLines={1}>{movement.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});
Hud.displayName = 'Hud';

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 },
  clock: { fontFamily: fonts.displayBold, fontVariant: ['tabular-nums'], includeFontPadding: false, textAlign: 'center', letterSpacing: -2 },
  roundRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  roundLabel: { fontFamily: fonts.displaySemi, fontSize: 26, letterSpacing: 4 },
  roundNumber: { fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 68, fontVariant: ['tabular-nums'], includeFontPadding: false },
  moves: { flexDirection: 'row', gap: 8, marginTop: 14, paddingHorizontal: 12 },
  move: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, maxWidth: 140 },
  moveReps: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 22 },
  moveName: { fontFamily: fonts.bodySemibold, fontSize: 12, flexShrink: 1 },
});

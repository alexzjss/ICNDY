import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WorkoutSession } from '../../domain/models';
import { prRoundsAt, roundDeltaMs } from '../../domain/pace';
import { activeElapsedMs, TimerState } from '../../domain/timer';
import { formatDuration } from '../session/format';
import { colors, fonts, withAlpha } from '../../theme';

export type PaceChipProps = {
  pr?: WorkoutSession;
  timer: TimerState;
  splits: number[];
  /** Instante (ms) do último toque; o delta do round fica visível por 6s. */
  lastTapAt: number;
};

/** Ritmo vs PR: delta do último round, depois comparação de rounds no mesmo ponto do tempo. */
export const PaceChip = memo(({ pr, timer, splits, lastTapAt }: PaceChipProps) => {
  const { durationMs, startedAtMs, pausedAtMs, pausedDurationMs, elapsedBeforePauseMs } = timer;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!pr || now < startedAtMs) return null;

  const rounds = splits.length;
  let label: string | undefined;
  let tone: 'ahead' | 'behind' | 'even' = 'even';

  if (rounds > 0 && now - lastTapAt < 6000) {
    const delta = roundDeltaMs({ roundSplitsMs: splits }, pr, rounds - 1);
    if (delta !== undefined) {
      if (Math.abs(delta) < 1000) label = '● no ritmo do PR';
      else if (delta < 0) {
        tone = 'ahead';
        label = `▲ ${formatDuration(-delta)} à frente`;
      } else {
        tone = 'behind';
        label = `▼ ${formatDuration(delta)} atrás`;
      }
    }
  }
  if (!label) {
    const elapsed = activeElapsedMs({ durationMs, startedAtMs, pausedAtMs, pausedDurationMs, elapsedBeforePauseMs }, now);
    const diff = rounds - prRoundsAt(pr, elapsed);
    const plural = Math.abs(diff) === 1 ? 'round' : 'rounds';
    if (diff > 0) {
      tone = 'ahead';
      label = `▲ ${diff} ${plural} à frente`;
    } else if (diff < 0) {
      tone = 'behind';
      label = `▼ ${-diff} ${plural} atrás`;
    } else {
      label = '● no ritmo do PR';
    }
  }

  const color = tone === 'ahead' ? colors.success : tone === 'behind' ? colors.danger : colors.text;
  return (
    <View pointerEvents="none" style={[styles.chip, { borderColor: withAlpha(color, 0.6) }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
});
PaceChip.displayName = 'PaceChip';

const styles = StyleSheet.create({
  chip: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, backgroundColor: withAlpha(colors.bg, 0.82) },
  text: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 26, letterSpacing: 0.5 },
});

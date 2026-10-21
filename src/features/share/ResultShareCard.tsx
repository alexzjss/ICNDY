import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { liquidColorFor } from '../../domain/speed';
import { roundDurations } from '../../domain/splits';
import { colors, fonts, withAlpha } from '../../theme';

export type ResultShareData = {
  title: string;
  /** Ex.: "ter, 21 out". */
  dateLabel: string;
  rounds: number;
  additional: number;
  totalReps: number;
  splits: number[];
  rpe?: number;
  goalText?: string;
  isPr?: boolean;
  streak: number;
};

/** Largura-base de projeto (4:5 = 1080x1350); tudo escala por width / BASE. */
const BASE = 360;
export const CARD_RATIO = 1350 / 1080;

export type ResultShareCardProps = { data: ResultShareData; width: number };

/** Imagem do resultado (4:5). Fundo preto fosco, tudo proporcional a `width`. */
export const ResultShareCard = forwardRef<View, ResultShareCardProps>(({ data, width }, ref) => {
  const u = (n: number) => (n * width) / BASE;
  const durations = roundDurations(data.splits);
  const max = Math.max(1, ...durations);
  const barsHeight = u(70);

  return (
    <View ref={ref} collapsable={false} style={{ width, height: width * CARD_RATIO, backgroundColor: '#000000', padding: u(24), justifyContent: 'space-between' }}>
      <View style={styles.row}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: u(34), lineHeight: u(38), color: colors.accent, letterSpacing: u(3) }}>ICNDY</Text>
        {data.isPr ? (
          <View style={{ backgroundColor: colors.accent, paddingHorizontal: u(12), paddingVertical: u(4), borderRadius: u(99) }}>
            <Text style={{ fontFamily: fonts.display, fontSize: u(16), lineHeight: u(20), color: colors.onAccent, letterSpacing: u(1) }}>NOVO PR</Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: u(2) }}>
        <Text style={{ fontFamily: fonts.display, fontSize: u(26), lineHeight: u(30), color: colors.text }} numberOfLines={2}>{data.title}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: u(13), color: colors.muted }}>{data.dateLabel}</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: u(8) }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: u(120), lineHeight: u(120), color: colors.accent, fontVariant: ['tabular-nums'] }}>{`R${data.rounds}`}</Text>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: u(54), lineHeight: u(70), color: colors.text, fontVariant: ['tabular-nums'] }}>{`+${data.additional}`}</Text>
        </View>
        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: u(14), color: colors.muted }}>{`${data.totalReps} reps no total`}</Text>
      </View>

      {durations.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: barsHeight, gap: u(Math.max(1, 4 - durations.length / 12)) }}>
          {durations.map((duration, i) => (
            <View key={i} style={{ flex: 1, height: Math.max(u(4), (duration / max) * barsHeight), borderRadius: u(2), backgroundColor: liquidColorFor(data.splits.slice(0, i + 1)) }} />
          ))}
        </View>
      ) : null}

      <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha('#FFFFFF', 0.2), paddingTop: u(14) }]}>
        <Stat u={u} label="Streak" value={`${data.streak} ${data.streak === 1 ? 'dia' : 'dias'}`} />
        {data.rpe ? <Stat u={u} label="RPE" value={`${data.rpe}/10`} /> : null}
        {data.goalText ? <Stat u={u} label="Meta" value={data.goalText.replace(/^Meta \d+ · /, '')} /> : null}
      </View>
    </View>
  );
});
ResultShareCard.displayName = 'ResultShareCard';

const Stat = ({ u, label, value }: { u: (n: number) => number; label: string; value: string }) => (
  <View>
    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: u(10), color: colors.muted, textTransform: 'uppercase', letterSpacing: u(1) }}>{label}</Text>
    <Text style={{ fontFamily: fonts.display, fontSize: u(20), lineHeight: u(24), color: colors.text }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

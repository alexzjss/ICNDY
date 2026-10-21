import { StyleSheet, View } from 'react-native';
import { Stepper, Text } from '../../components';
import { colors, fonts } from '../../theme';
import { formatTime, parseTime, snapMinute } from './time';

type Props = { value: string; onChange: (value: string) => void };

/** Seletor de horário próprio: steppers de hora (0-23) e minuto (passos de 5) com prévia grande. */
export const TimePicker = ({ value, onChange }: Props) => {
  const { hour, minute: rawMinute } = parseTime(value);
  const minute = snapMinute(rawMinute);
  return (
    <View style={styles.root} accessibilityLabel={`Horário ${formatTime(hour, minute)}`}>
      <Text style={styles.preview}>{formatTime(hour, minute)}</Text>
      <View style={styles.row}>
        <Text variant="label" style={styles.label}>Hora</Text>
        <Stepper value={hour} min={0} max={23} onChange={(h) => onChange(formatTime(h, minute))} valueSize={34} style={styles.stepper} />
      </View>
      <View style={styles.row}>
        <Text variant="label" style={styles.label}>Minuto</Text>
        <Stepper value={minute} min={0} max={55} step={5} onChange={(m) => onChange(formatTime(hour, m))} valueSize={34} style={styles.stepper} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 12, alignItems: 'stretch' },
  preview: { fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 68, color: colors.accent, textAlign: 'center', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { width: 64 },
  stepper: { flex: 1, maxWidth: 240 },
});

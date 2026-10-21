import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Header, Screen, StaggerIn, Text, Toggle } from '../components';
import { useApp } from '../context/AppContext';
import { saveSchedule } from '../database/repositories';
import { exportBackup, restoreBackup } from '../services/backup';
import { scheduleReminders, updateTrainingReminders } from '../services/notifications';
import { colors, fonts } from '../theme';

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function SettingsScreen() {
  const { settings, updateSettings, schedule, refresh } = useApp();
  const weekdays = schedule.at(-1)?.weekdays ?? [1, 3, 5];
  const toggleDay = async (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((item) => item !== day) : [...weekdays, day].sort();
    await saveSchedule(next);
    await refresh();
    if (settings.remindersEnabled) await scheduleReminders(next, settings.reminderTime).catch(() => undefined);
  };
  return (
    <Screen>
      <Header back eyebrow="Local e privado" title="Ajustes" />
      <StaggerIn index={1}>
        <Card>
          <Text variant="label">Dias de treino planejados</Text>
          <View style={styles.days}>
            {DAYS.map((day, index) => {
              const on = weekdays.includes(index);
              return (
                <Pressable key={index} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => void toggleDay(index)} style={[styles.day, on && styles.dayOn]}>
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: on ? colors.onAccent : colors.muted }}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption">As mudanças valem a partir de amanhã e preservam as agendas anteriores.</Text>
        </Card>
      </StaggerIn>
      <StaggerIn index={2}>
        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text variant="heading">Lembretes de treino</Text>
              <Text variant="caption">Notificações locais opcionais</Text>
            </View>
            <Toggle
              accessibilityLabel="Lembretes de treino"
              value={settings.remindersEnabled}
              onValueChange={async (value) => {
                try {
                  const scheduled = await updateTrainingReminders(value, weekdays, settings.reminderTime);
                  await updateSettings({ ...settings, remindersEnabled: scheduled && value });
                  if (value && !scheduled) Alert.alert('Lembretes indisponíveis', 'A permissão de notificações não foi concedida. Você ainda pode usar o ICNDY normalmente.');
                } catch (error) {
                  Alert.alert('Não foi possível salvar os lembretes', String(error));
                }
              }}
            />
          </View>
        </Card>
      </StaggerIn>
      <StaggerIn index={3}>
        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text variant="heading">Sons</Text>
              <Text variant="caption">Bipes durante o treino</Text>
            </View>
            <Toggle accessibilityLabel="Sons" value={settings.soundEnabled} onValueChange={(value) => void updateSettings({ ...settings, soundEnabled: value })} />
          </View>
        </Card>
      </StaggerIn>
      <StaggerIn index={4} style={styles.section}>
        <Text variant="label">Seus dados</Text>
        <Button icon="share-outline" onPress={() => exportBackup().catch((error) => Alert.alert('Falha ao exportar', String(error)))}>Exportar backup</Button>
        <Button
          variant="secondary"
          icon="download-outline"
          onPress={() =>
            Alert.alert('Substituir dados locais?', 'Isso sobrescreve os treinos e ajustes atuais.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Restaurar',
                style: 'destructive',
                onPress: () =>
                  restoreBackup()
                    .then((restored) => {
                      if (restored) return refresh();
                    })
                    .catch((error) => Alert.alert('Falha ao restaurar', String(error))),
              },
            ])
          }
        >
          Restaurar backup
        </Button>
      </StaggerIn>
      <Text variant="caption">Seus treinos ficam neste dispositivo. Não há conta, sincronização na nuvem, anúncios nem análises. ICNDY 1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  day: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.accent },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  section: { gap: 12 },
});

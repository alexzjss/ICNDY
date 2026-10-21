import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { Button, Card, Header, Screen, StaggerIn, Text, Toggle, useToast } from '../components';
import { useApp } from '../context/AppContext';
import { saveSchedule } from '../database/repositories';
import { exportBackup, restoreBackup } from '../services/backup';
import { exportLog } from '../services/log';
import { cancelReminders, updateTrainingReminders } from '../services/notifications';
import { DayPicker } from '../features/settings/DayPicker';
import { TimePicker } from '../features/settings/TimePicker';
import { formatTime, parseTime, snapMinute } from '../features/settings/time';
import { colors } from '../theme';

const latestWeekdays = (schedule: { effectiveFrom: string; weekdays: number[] }[]) =>
  [...schedule].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1)?.weekdays ?? [1, 3, 5];

export default function SettingsScreen() {
  const { settings, updateSettings, schedule, refresh } = useApp();
  const toast = useToast();
  const reduced = useReducedMotion();
  const [days, setDays] = useState(() => latestWeekdays(schedule));
  const [time, setTime] = useState(() => {
    const t = parseTime(settings.reminderTime);
    return formatTime(t.hour, snapMinute(t.minute));
  });
  const [busy, setBusy] = useState<'export' | 'restore'>();

  // Sempre o valor mais recente, para os callbacks adiados/ao desmontar.
  const latest = useRef({ settings, days, time });
  latest.current = { settings, days, time };
  const pendingDays = useRef(false);
  const pendingTime = useRef(false);
  const daysTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persistDays = useCallback(async () => {
    if (!pendingDays.current) return;
    pendingDays.current = false;
    const { days: next, settings: s, time: t } = latest.current;
    try {
      await saveSchedule(next);
      await refresh();
      if (s.remindersEnabled) await updateTrainingReminders(true, next, t);
      toast.show({ message: 'Agenda salva · vale a partir de amanhã', variant: 'success' });
    } catch (error) {
      toast.show({ message: error instanceof Error ? error.message : 'Não foi possível salvar a agenda', variant: 'danger' });
    }
  }, [refresh, toast]);

  const persistTime = useCallback(async () => {
    if (!pendingTime.current) return;
    pendingTime.current = false;
    const { days: d, settings: s, time: t } = latest.current;
    try {
      await updateSettings({ ...s, reminderTime: t });
      if (s.remindersEnabled) await updateTrainingReminders(true, d, t);
    } catch (error) {
      toast.show({ message: error instanceof Error ? error.message : 'Não foi possível salvar o horário', variant: 'danger' });
    }
  }, [updateSettings, toast]);

  // Grava o que estiver pendente ao sair da tela.
  useEffect(
    () => () => {
      if (daysTimer.current) clearTimeout(daysTimer.current);
      if (timeTimer.current) clearTimeout(timeTimer.current);
      void persistDays();
      void persistTime();
    },
    [persistDays, persistTime],
  );

  const changeDays = (next: number[]) => {
    if (next.length === 0) {
      toast.show({ message: 'Mantenha pelo menos um dia de treino', variant: 'danger' });
      return;
    }
    setDays(next);
    pendingDays.current = true;
    if (daysTimer.current) clearTimeout(daysTimer.current);
    daysTimer.current = setTimeout(() => void persistDays(), 700);
  };

  const changeTime = (next: string) => {
    setTime(next);
    pendingTime.current = true;
    if (timeTimer.current) clearTimeout(timeTimer.current);
    timeTimer.current = setTimeout(() => void persistTime(), 700);
  };

  const toggleReminders = async (value: boolean) => {
    try {
      const scheduled = await updateTrainingReminders(value, days, time);
      await updateSettings({ ...settings, remindersEnabled: value && scheduled, reminderTime: time });
      if (value && !scheduled) toast.show({ message: 'Permissão de notificações negada. Ative nas configurações do aparelho.', variant: 'danger' });
      else toast.show({ message: value ? `Lembretes ativados às ${time}` : 'Lembretes desativados', variant: 'success' });
    } catch (error) {
      await cancelReminders().catch(() => undefined);
      toast.show({ message: error instanceof Error ? error.message : 'Não foi possível salvar os lembretes', variant: 'danger' });
    }
  };

  const doExport = async () => {
    setBusy('export');
    try {
      await exportBackup();
      toast.show({ message: 'Backup exportado', variant: 'success' });
    } catch (error) {
      toast.show({ message: `Falha ao exportar: ${error instanceof Error ? error.message : String(error)}`, variant: 'danger' });
    } finally {
      setBusy(undefined);
    }
  };

  const doExportLog = async () => {
    try {
      await exportLog();
    } catch (error) {
      toast.show({ message: `Falha ao exportar o log: ${error instanceof Error ? error.message : String(error)}`, variant: 'danger' });
    }
  };

  const doRestore = () =>
    Alert.alert('Substituir dados locais?', 'Isso sobrescreve os treinos e ajustes atuais pelos do arquivo escolhido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        style: 'destructive',
        onPress: async () => {
          setBusy('restore');
          try {
            const restored = await restoreBackup();
            if (restored) {
              await refresh();
              toast.show({ message: 'Backup restaurado', variant: 'success' });
            }
          } catch (error) {
            toast.show({ message: `Falha ao restaurar: ${error instanceof Error ? error.message : String(error)}`, variant: 'danger' });
          } finally {
            setBusy(undefined);
          }
        },
      },
    ]);

  const layout = reduced ? undefined : LinearTransition.springify().damping(18);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <Header back eyebrow="Local e privado" title="Ajustes" />

      <StaggerIn index={1}>
        <Card>
          <Text variant="label">Treino · dias planejados</Text>
          <DayPicker value={days} onChange={changeDays} />
          <Text variant="caption">
            {days.length} {days.length === 1 ? 'dia' : 'dias'} por semana. Mudanças valem a partir de amanhã e preservam o histórico da agenda anterior.
          </Text>
        </Card>
      </StaggerIn>

      <StaggerIn index={2}>
        <Card layout={layout}>
          <View style={styles.row}>
            <View style={styles.icon}><Ionicons name="notifications-outline" size={20} color={colors.accent} /></View>
            <View style={styles.flex}>
              <Text variant="heading">Lembretes</Text>
              <Text variant="caption">Notificação nos dias planejados</Text>
            </View>
            <Toggle accessibilityLabel="Lembretes de treino" value={settings.remindersEnabled} onValueChange={(v) => void toggleReminders(v)} />
          </View>
          {settings.remindersEnabled ? (
            <Animated.View entering={reduced ? undefined : FadeIn.duration(250)} exiting={reduced ? undefined : FadeOut.duration(150)} style={styles.picker}>
              <TimePicker value={time} onChange={changeTime} />
            </Animated.View>
          ) : null}
        </Card>
      </StaggerIn>

      <StaggerIn index={3}>
        <Card>
          <View style={styles.row}>
            <View style={styles.icon}><Ionicons name="volume-high-outline" size={20} color={colors.accent} /></View>
            <View style={styles.flex}>
              <Text variant="heading">Sons no treino</Text>
              <Text variant="caption">Bipes de contagem, último minuto e fim</Text>
            </View>
            <Toggle accessibilityLabel="Sons no treino" value={settings.soundsEnabled} onValueChange={(v) => void updateSettings({ ...settings, soundsEnabled: v })} />
          </View>
          <View style={styles.row}>
            <View style={styles.icon}><Ionicons name="phone-portrait-outline" size={20} color={colors.accent} /></View>
            <View style={styles.flex}>
              <Text variant="heading">Vibração</Text>
              <Text variant="caption">Feedback tátil em toques e rounds</Text>
            </View>
            <Toggle accessibilityLabel="Vibração" value={settings.hapticsEnabled} onValueChange={(v) => void updateSettings({ ...settings, hapticsEnabled: v })} />
          </View>
        </Card>
      </StaggerIn>

      <StaggerIn index={4} style={styles.section}>
        <Text variant="label">Seus dados</Text>
        <Button icon="share-outline" loading={busy === 'export'} disabled={busy !== undefined} onPress={() => void doExport()}>Exportar backup</Button>
        <Button variant="secondary" icon="download-outline" loading={busy === 'restore'} disabled={busy !== undefined} onPress={doRestore}>Restaurar backup</Button>
        <Button variant="secondary" icon="document-text-outline" disabled={busy !== undefined} onPress={() => void doExportLog()}>Exportar log de diagnóstico</Button>
      </StaggerIn>

      <StaggerIn index={5}>
        <Card>
          <View style={styles.row}>
            <View style={styles.icon}><Ionicons name="lock-closed-outline" size={20} color={colors.success} /></View>
            <View style={styles.flex}>
              <Text variant="heading">Privacidade</Text>
              <Text variant="caption">
                Seus dados ficam no aparelho. Sem conta, sem nuvem, sem anúncios e sem análises. Só você tem acesso, a não ser que exporte um backup.
              </Text>
            </View>
          </View>
        </Card>
      </StaggerIn>

      <Text variant="caption" align="center">ICNDY · versão {version}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  picker: { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  section: { gap: 12 },
});

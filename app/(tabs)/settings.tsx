import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { saveSchedule } from '../../src/database/repositories';
import { exportBackup, restoreBackup } from '../../src/services/backup';
import { updateTrainingReminders } from '../../src/services/notifications';
import { colors } from '../../src/theme';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const intensityLabels = { discreet: 'Discreet', vibrant: 'Vibrant', contrast: 'High contrast' } as const;

export default function SettingsScreen() {
  const { settings, updateSettings, schedule, refresh } = useApp();
  const weekdays = schedule.at(-1)?.weekdays ?? [1, 3, 5];
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'An unexpected error occurred.';
  const handleExport = async () => {
    try { await exportBackup(); Alert.alert('Backup exported', 'Your ICNDY data is ready to share.'); }
    catch (error) { Alert.alert('Export failed', errorMessage(error)); }
  };
  const handleRestore = async () => {
    try {
      const restored = await restoreBackup();
      if (restored) { await refresh(); Alert.alert('Backup restored', 'Your local sessions and preferences were replaced successfully.'); }
    } catch (error) { Alert.alert('Restore failed', errorMessage(error)); }
  };
  const toggleDay = async (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((item) => item !== day) : [...weekdays, day].sort();
    await saveSchedule(next);
    await refresh();
  };
  const toggle = (key: 'hapticsEnabled' | 'soundsEnabled' | 'reduceMotion') =>
    updateSettings({ ...settings, [key]: !settings[key] });

  return <Screen>
    <Label>LOCAL / PRIVATE</Label><Title>Settings.</Title>
    <Card><Label>Planned training days</Label><View style={styles.days}>{days.map((day, index) =>
      <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={day} accessibilityState={{ checked: weekdays.includes(index) }} hitSlop={6} onPress={() => toggleDay(index)} style={[styles.day, weekdays.includes(index) && styles.dayActive]}>
        <Text style={[styles.dayText, weekdays.includes(index) && styles.dayTextActive]}>{day.slice(0, 1)}</Text>
      </Pressable>)}</View><Text style={styles.meta}>Changes apply from tomorrow and preserve prior schedules.</Text></Card>
    <Card><View style={styles.row}><View><Text style={styles.name}>Training reminders</Text><Text style={styles.meta}>Optional local notifications</Text></View>
      <Switch accessibilityLabel="Training reminders" accessibilityState={{ checked: settings.remindersEnabled }} value={settings.remindersEnabled} onValueChange={async (value) => { try { const scheduled = await updateTrainingReminders(value, weekdays, settings.reminderTime); await updateSettings({ ...settings, remindersEnabled: scheduled && value }); if (value && !scheduled) Alert.alert('Reminders unavailable', 'Notification permission was not granted. You can still use ICNDY normally.'); } catch (error) { Alert.alert('Could not save reminders', String(error)); } }} trackColor={{ true: colors.lime }} />
    </View></Card>
    <Card><Label>Workout preferences</Label>
      <Preference label="Timer display" value={settings.timerDisplay === 'numeric' ? 'Numeric' : 'Circular'} onPress={() => updateSettings({ ...settings, timerDisplay: settings.timerDisplay === 'numeric' ? 'circular' : 'numeric' })} />
      <Preference label="Theme intensity" value={intensityLabels[settings.themeIntensity]} onPress={() => updateSettings({ ...settings, themeIntensity: settings.themeIntensity === 'vibrant' ? 'contrast' : settings.themeIntensity === 'contrast' ? 'discreet' : 'vibrant' })} />
      <Preference label="Haptic feedback" value={settings.hapticsEnabled ? 'On' : 'Off'} onPress={() => toggle('hapticsEnabled')} />
      <Preference label="Motion" value={settings.reduceMotion ? 'Reduced' : 'Full'} onPress={() => toggle('reduceMotion')} />
      <Preference label="Workout sounds" value={settings.soundsEnabled ? 'On' : 'Off'} onPress={() => toggle('soundsEnabled')} />
    </Card>
    <View style={styles.section}><Label>Your data</Label><Button onPress={() => void handleExport()}>Export backup</Button><Button secondary onPress={() => Alert.alert('Replace local data?', 'This overwrites current sessions and settings only after the file passes validation.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Restore', style: 'destructive', onPress: () => void handleRestore() }])}>Restore backup</Button></View>
    <Text style={styles.notice}>Your workout records stay on this device. There is no account, cloud sync, advertising, or analytics. ICNDY 1.0.0</Text>
  </Screen>;
}

const Preference = ({ label, value, hint, onPress }: { label: string; value: string; hint?: string; onPress: () => void }) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityValue={{ text: value }} accessibilityHint="Double tap to change" hitSlop={6} onPress={onPress} style={styles.preference}><View><Text style={styles.name}>{label}</Text>{hint && <Text style={styles.meta}>{hint}</Text>}</View><Text style={styles.preferenceValue}>{value}  ›</Text></Pressable>;
const styles = StyleSheet.create({ days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, day: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, dayActive: { backgroundColor: colors.lime }, dayText: { color: colors.muted, fontWeight: '900' }, dayTextActive: { color: colors.ink }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, name: { color: colors.text, fontWeight: '800', fontSize: 16 }, meta: { color: colors.muted, fontSize: 12 }, section: { gap: 12 }, preference: { minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, preferenceValue: { color: colors.lime, fontWeight: '800' }, notice: { color: colors.muted, lineHeight: 18, fontSize: 12 } });

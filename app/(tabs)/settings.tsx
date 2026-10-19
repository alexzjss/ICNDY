import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Label, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { saveSchedule } from '../../src/database/repositories';
import { exportBackup, restoreBackup } from '../../src/services/backup';
import { previewFeedback } from '../../src/services/feedback';
import { updateTrainingReminders } from '../../src/services/notifications';
import { colors } from '../../src/theme';

const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const intensityLabels = { discreet: 'Discreta', vibrant: 'Vibrante', contrast: 'Alto contraste' } as const;

export default function SettingsScreen() {
  const { settings, updateSettings, schedule, refresh } = useApp();
  const [previewing, setPreviewing] = useState(false);
  const weekdays = schedule.at(-1)?.weekdays ?? [1, 3, 5];
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
  const handleExport = async () => {
    try { await exportBackup(); Alert.alert('Cópia exportada', 'Seu backup está pronto para compartilhar.'); }
    catch (error) { Alert.alert('Falha ao exportar', errorMessage(error)); }
  };
  const handleRestore = async () => {
    try {
      const restored = await restoreBackup();
      if (restored) { await refresh(); Alert.alert('Backup restaurado', 'Seus treinos e preferências foram recuperados.'); }
    } catch (error) { Alert.alert('Falha ao restaurar', errorMessage(error)); }
  };
  const toggleDay = async (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((item) => item !== day) : [...weekdays, day].sort();
    await saveSchedule(next);
    await refresh();
  };
  const toggle = (key: 'hapticsEnabled' | 'soundsEnabled' | 'reduceMotion') => updateSettings({ ...settings, [key]: !settings[key] });
  const playPreview = async () => {
    if (previewing) return;
    setPreviewing(true);
    try { await previewFeedback('round-complete'); }
    catch (error) { Alert.alert('Áudio indisponível', errorMessage(error)); }
    finally { setTimeout(() => setPreviewing(false), 400); }
  };

  return <Screen>
    <View style={styles.heading}><View><Label>SEU APP, DO SEU JEITO</Label><Title size={30}>Ajustes.</Title></View><Text style={styles.mark}>⚙</Text></View>
    <Card><View style={styles.cardHeading}><Label>DIAS DE TREINO</Label><Text style={styles.cardHint}>DIAS DE DESCANSO NÃO QUEBRAM A SEQUÊNCIA</Text></View><View style={styles.days}>{days.map((day, index) => <Pressable key={index} accessibilityRole="checkbox" accessibilityLabel={['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][index]} accessibilityState={{ checked: weekdays.includes(index) }} hitSlop={6} onPress={() => void toggleDay(index)} style={[styles.day, weekdays.includes(index) && styles.dayActive]}><Text style={[styles.dayText, weekdays.includes(index) && styles.dayTextActive]}>{day}</Text></Pressable>)}</View></Card>
    <Card><View style={styles.settingRow}><View style={styles.settingCopy}><Text style={styles.name}>Lembretes de treino</Text><Text style={styles.meta}>Notificações locais opcionais</Text></View><Switch accessibilityLabel="Lembretes de treino" accessibilityState={{ checked: settings.remindersEnabled }} value={settings.remindersEnabled} onValueChange={async (value) => { try { const scheduled = await updateTrainingReminders(value, weekdays, settings.reminderTime); await updateSettings({ ...settings, remindersEnabled: scheduled && value }); if (value && !scheduled) Alert.alert('Lembretes indisponíveis', 'A permissão de notificações não foi concedida.'); } catch (error) { Alert.alert('Não foi possível salvar', String(error)); } }} trackColor={{ true: colors.lime }} thumbColor={settings.remindersEnabled ? colors.ink : undefined} /></View></Card>
    <Card><Label>FEEDBACK DO TREINO</Label>
      <Preference label="Sons eletrônicos" value={settings.soundsEnabled ? 'Ligados' : 'Desligados'} onPress={() => toggle('soundsEnabled')} />
      <Pressable accessibilityRole="button" disabled={previewing} onPress={() => void playPreview()} style={({ pressed }) => [styles.preview, pressed && styles.previewPressed, previewing && styles.previewDisabled]}><Text style={styles.previewIcon}>♪</Text><Text style={styles.previewText}>{previewing ? 'OUVINDO…' : 'TESTAR SOM DA SÉRIE'}</Text><Text style={styles.previewPlay}>▶</Text></Pressable>
      <Preference label="Vibração intensa" value={settings.hapticsEnabled ? 'Ligada' : 'Desligada'} onPress={() => toggle('hapticsEnabled')} />
      <Preference label="Animações" value={settings.reduceMotion ? 'Reduzidas' : 'Dinâmicas'} onPress={() => toggle('reduceMotion')} />
    </Card>
    <Card><Label>APARÊNCIA</Label><Preference label="Intensidade do tema" value={intensityLabels[settings.themeIntensity]} onPress={() => updateSettings({ ...settings, themeIntensity: settings.themeIntensity === 'vibrant' ? 'contrast' : settings.themeIntensity === 'contrast' ? 'discreet' : 'vibrant' })} /></Card>
    <View style={styles.data}><Label>SEUS DADOS FICAM NO SEU DISPOSITIVO</Label><View style={styles.dataButtons}><Button secondary onPress={() => void handleExport()}>Exportar backup</Button><Button secondary onPress={() => Alert.alert('Substituir dados locais?', 'Treinos e preferências atuais serão trocados somente depois da validação do arquivo.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Restaurar', style: 'destructive', onPress: () => void handleRestore() }])}>Restaurar</Button></View></View>
    <Text style={styles.notice}>Sem conta, anúncios ou sincronização em nuvem · ICNDY 1.0.0</Text>
  </Screen>;
}

const Preference = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityValue={{ text: value }} accessibilityHint="Toque para alterar" hitSlop={5} onPress={onPress} style={styles.preference}><Text style={styles.name}>{label}</Text><Text style={styles.preferenceValue}>{value}  ›</Text></Pressable>;
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, mark: { color: colors.lime, fontSize: 22 }, cardHeading: { gap: 3 }, cardHint: { color: '#727D6B', fontSize: 7, fontWeight: '800', letterSpacing: 0.6 }, days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }, day: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, dayActive: { backgroundColor: colors.lime }, dayText: { color: colors.muted, fontSize: 11, fontWeight: '900' }, dayTextActive: { color: colors.ink }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, settingCopy: { flex: 1, gap: 3 }, name: { color: colors.text, fontWeight: '800', fontSize: 12 }, meta: { color: colors.muted, fontSize: 9 }, preference: { minHeight: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, preferenceValue: { color: colors.lime, fontWeight: '800', fontSize: 9 }, preview: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#1E291A' }, previewPressed: { transform: [{ scale: 0.98 }], opacity: 0.85 }, previewDisabled: { opacity: 0.6 }, previewIcon: { color: colors.lime, fontSize: 14 }, previewText: { color: colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1, flex: 1 }, previewPlay: { color: colors.text, fontSize: 9 }, data: { gap: 10 }, dataButtons: { flexDirection: 'row', gap: 9 }, notice: { color: colors.muted, lineHeight: 15, fontSize: 9, textAlign: 'center' },
});

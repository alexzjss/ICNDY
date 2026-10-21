import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/client';
import { getSchedule, getSettings, listSessions, saveSchedulePeriod, saveSession, saveSettings } from '../database/repositories';
import { localDateString } from '../domain/dates';
import { cancelReminders, scheduleReminders } from './notifications';
import { BACKUP_VERSION, migrateBackup } from './backupFormat';

export { BACKUP_VERSION };

export const exportBackup = async () => {
  const backup = { schemaVersion: BACKUP_VERSION, exportedAt: new Date().toISOString(), sessions: await listSessions(true), settings: await getSettings(), schedules: await getSchedule() };
  const uri = `${FileSystem.cacheDirectory}icndy-backup-${localDateString()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Compartilhar backup do ICNDY' });
  return uri;
};

export const restoreBackup = async () => {
  const selection = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (selection.canceled) return false;
  const content = await FileSystem.readAsStringAsync(selection.assets[0].uri);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Este arquivo não é um backup do ICNDY compatível.');
  }
  const backup = migrateBackup(parsed);
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM workout_sessions; DELETE FROM app_settings; DELETE FROM training_schedule_periods;');
    for (const session of backup.sessions) await saveSession(session);
    await saveSettings(backup.settings);
    for (const period of backup.schedules) await saveSchedulePeriod(period);
  });
  try {
    const latest = backup.schedules.reduce<(typeof backup.schedules)[number] | undefined>((last, period) => (!last || period.effectiveFrom >= last.effectiveFrom ? period : last), undefined);
    if (backup.settings.remindersEnabled && latest) await scheduleReminders(latest.weekdays, backup.settings.reminderTime);
    else await cancelReminders();
  } catch {
    // Lembretes são opcionais; falha aqui não invalida a restauração.
  }
  return true;
};

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/client';
import { getSchedule, getSettings, listSessions, saveSchedulePeriod, saveSession, saveSettings } from '../database/repositories';
import { WorkoutSession } from '../domain/models';

export const BACKUP_VERSION = 1;
export const exportBackup = async () => {
  const backup = { schemaVersion: BACKUP_VERSION, exportedAt: new Date().toISOString(), sessions: await listSessions(true), settings: await getSettings(), schedules: await getSchedule() };
  const uri = `${FileSystem.cacheDirectory}icndy-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Share ICNDY backup' });
  return uri;
};
export const restoreBackup = async () => {
  const selection = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (selection.canceled) return false;
  const content = await FileSystem.readAsStringAsync(selection.assets[0].uri);
  const backup = JSON.parse(content) as { schemaVersion: number; sessions: WorkoutSession[]; settings: Parameters<typeof saveSettings>[0]; schedules: Awaited<ReturnType<typeof getSchedule>> };
  if (backup.schemaVersion !== BACKUP_VERSION || !Array.isArray(backup.sessions) || !backup.settings || !Array.isArray(backup.schedules)) throw new Error('This file is not a supported ICNDY backup.');
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM workout_sessions; DELETE FROM app_settings; DELETE FROM training_schedule_periods;');
    for (const session of backup.sessions) await saveSession(session);
    await saveSettings(backup.settings);
    for (const period of backup.schedules) await saveSchedulePeriod(period);
  });
  return true;
};

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../database/client';
import { defaultSettings, getSchedule, getSettings, listSessions } from '../database/repositories';
import { comparisonKey, repsPerRound } from '../domain/presets';
import { totalReps } from '../domain/scoring';
import { AppSettings, MovementOption, SchedulePeriod, WorkoutSession } from '../domain/models';

export const BACKUP_VERSION = 1;

export type Backup = {
  schemaVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  sessions: WorkoutSession[];
  settings: AppSettings;
  schedules: SchedulePeriod[];
};

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const knownStatuses: WorkoutSession['status'][] = ['active', 'paused', 'finishing', 'completed', 'abandoned'];
const knownCompletionTypes: NonNullable<WorkoutSession['completionType']>[] = ['timer-finished', 'ended-early'];
const knownPresets: WorkoutSession['presetId'][] = ['classic', 'beginner'];
const knownGroups: MovementOption['group'][] = ['pull', 'push', 'squat'];
const settingKeys: (keyof AppSettings)[] = [
  'onboardingComplete', 'remindersEnabled', 'reminderTime', 'trackingStartDate',
  'timerDisplay', 'workoutLayout', 'themeIntensity', 'hapticsEnabled', 'soundsEnabled', 'reduceMotion',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isIsoDate = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10);
};
const isDateOnly = (value: unknown) => {
  if (typeof value !== 'string' || !dateOnlyPattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const isNonEmptyString = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 500;
const isNonNegativeInteger = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const hasUniqueIds = (values: { id: string }[]) => new Set(values.map(({ id }) => id)).size === values.length;

const validateMovement = (value: unknown): value is MovementOption => {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.key) && isNonEmptyString(value.label) &&
    isNonNegativeInteger(value.reps) && (value.reps as number) > 0 &&
    typeof value.group === 'string' && knownGroups.includes(value.group as MovementOption['group']);
};

const validateSession = (value: unknown): value is WorkoutSession => {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isIsoDate(value.createdAt) ||
    !isIsoDate(value.startedAt) || !isIsoDate(value.updatedAt) || !isDateOnly(value.localDate) ||
    !knownStatuses.includes(value.status as WorkoutSession['status']) ||
    !knownPresets.includes(value.presetId as WorkoutSession['presetId']) ||
    !isNonNegativeInteger(value.durationSeconds) || (value.durationSeconds as number) < 60 || (value.durationSeconds as number) > 3600 ||
    !Array.isArray(value.movements) || value.movements.length === 0 || !value.movements.every(validateMovement) ||
    !isNonNegativeInteger(value.completedRounds) || !isNonNegativeInteger(value.additionalReps) ||
    !isNonNegativeInteger(value.totalReps) || !isNonEmptyString(value.comparisonKey) ||
    !isNonNegativeInteger(value.pausedDurationMs) || !isNonNegativeInteger(value.elapsedBeforePauseMs)) return false;
  if (value.finishedAt !== undefined && !isIsoDate(value.finishedAt)) return false;
  if (value.pausedAt !== undefined && !isIsoDate(value.pausedAt)) return false;
  if (value.completionType !== undefined && !knownCompletionTypes.includes(value.completionType as NonNullable<WorkoutSession['completionType']>)) return false;
  if (value.notes !== undefined && typeof value.notes !== 'string') return false;
  const session = value as unknown as WorkoutSession;
  const config = { durationSeconds: session.durationSeconds, movements: session.movements };
  return session.additionalReps < repsPerRound(config) &&
    session.totalReps === totalReps(session.completedRounds, session.additionalReps, config) &&
    session.comparisonKey === comparisonKey(config);
};

const validateSettings = (value: unknown): AppSettings => {
  if (!isRecord(value)) throw new Error('Backup contains invalid app preferences.');
  const settings = { ...defaultSettings, ...value } as Record<string, unknown>;
  if (typeof settings.onboardingComplete !== 'boolean' || typeof settings.remindersEnabled !== 'boolean' ||
    typeof settings.reminderTime !== 'string' || !/^\d{2}:\d{2}$/.test(settings.reminderTime) ||
    !isDateOnly(settings.trackingStartDate) || !['numeric', 'circular'].includes(String(settings.timerDisplay)) ||
    !['compact', 'detailed'].includes(String(settings.workoutLayout)) ||
    !['discreet', 'vibrant', 'contrast'].includes(String(settings.themeIntensity)) ||
    typeof settings.hapticsEnabled !== 'boolean' || typeof settings.soundsEnabled !== 'boolean' ||
    typeof settings.reduceMotion !== 'boolean') throw new Error('Backup contains invalid app preferences.');
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  if (hours > 23 || minutes > 59) throw new Error('Backup contains an invalid reminder time.');
  return settings as AppSettings;
};

const validateSchedules = (value: unknown): SchedulePeriod[] => {
  if (!Array.isArray(value) || !value.every((period) => isRecord(period) &&
    isNonEmptyString(period.id) && isDateOnly(period.effectiveFrom) && Array.isArray(period.weekdays) &&
    period.weekdays.length <= 7 && period.weekdays.every((day) => isNonNegativeInteger(day) && day <= 6) &&
    new Set(period.weekdays).size === period.weekdays.length)) {
    throw new Error('Backup contains an invalid training schedule.');
  }
  const schedules = value as SchedulePeriod[];
  if (!hasUniqueIds(schedules)) throw new Error('Backup contains duplicate training schedule identifiers.');
  return schedules;
};

export const validateBackup = (value: unknown): Backup => {
  if (!isRecord(value)) throw new Error('Backup content must be a JSON object.');
  if (value.schemaVersion !== BACKUP_VERSION) throw new Error(`Unsupported ICNDY backup format version: ${String(value.schemaVersion)}.`);
  if (!isIsoDate(value.exportedAt)) throw new Error('Backup contains an invalid export date.');
  if (!Array.isArray(value.sessions) || !value.sessions.every(validateSession)) throw new Error('Backup contains an invalid workout session.');
  if (!hasUniqueIds(value.sessions)) throw new Error('Backup contains duplicate workout session identifiers.');
  return {
    schemaVersion: BACKUP_VERSION,
    exportedAt: value.exportedAt as string,
    sessions: value.sessions,
    settings: validateSettings(value.settings),
    schedules: validateSchedules(value.schedules),
  };
};

const writeBackupToDatabase = async (db: SQLite.SQLiteDatabase, backup: Backup) => {
  await db.execAsync('DELETE FROM workout_sessions; DELETE FROM app_settings; DELETE FROM training_schedule_periods;');
  for (const session of backup.sessions) {
    await db.runAsync(
      `INSERT INTO workout_sessions (id, created_at, started_at, finished_at, updated_at, status, preset_id, duration_seconds, movements_json, completed_rounds, additional_reps, total_reps, comparison_key, completion_type, notes, local_date, paused_at, paused_duration_ms, elapsed_before_pause_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id, session.createdAt, session.startedAt, session.finishedAt ?? null, session.updatedAt, session.status, session.presetId,
      session.durationSeconds, JSON.stringify(session.movements), session.completedRounds, session.additionalReps, session.totalReps,
      session.comparisonKey, session.completionType ?? null, session.notes ?? null, session.localDate, session.pausedAt ?? null,
      session.pausedDurationMs, session.elapsedBeforePauseMs,
    );
  }
  for (const key of settingKeys) {
    await db.runAsync('INSERT INTO app_settings (key, value) VALUES (?, ?)', key, JSON.stringify(backup.settings[key]));
  }
  for (const period of backup.schedules) {
    await db.runAsync('INSERT INTO training_schedule_periods (id, effective_from, weekdays_json) VALUES (?, ?, ?)', period.id, period.effectiveFrom, JSON.stringify(period.weekdays));
  }
};

export const restoreBackupData = async (backup: Backup, database?: SQLite.SQLiteDatabase) => {
  const db = database ?? await getDatabase();
  if (typeof db.withExclusiveTransactionAsync === 'function') {
    await db.withExclusiveTransactionAsync((transaction) => writeBackupToDatabase(transaction, backup));
  } else {
    await db.withTransactionAsync(() => writeBackupToDatabase(db, backup));
  }
};

export const parseBackupJson = (content: string): Backup => {
  try {
    return validateBackup(JSON.parse(content));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The selected file is not valid JSON.');
    throw error;
  }
};

export const restoreBackupContents = async (value: unknown, database?: SQLite.SQLiteDatabase) => {
  await restoreBackupData(validateBackup(value), database);
};

export const exportBackup = async () => {
  const backup: Backup = {
    schemaVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    sessions: await listSessions(false),
    settings: await getSettings(),
    schedules: await getSchedule(),
  };
  const uri = `${FileSystem.cacheDirectory}icndy-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Share ICNDY backup' });
  return uri;
};

export const restoreBackup = async () => {
  const selection = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (selection.canceled) return false;
  await restoreBackupContents(parseBackupJson(await FileSystem.readAsStringAsync(selection.assets[0].uri)));
  return true;
};

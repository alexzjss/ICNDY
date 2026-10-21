import { AppSettings, SchedulePeriod, WorkoutSession } from '../domain/models';
import { localDateString } from '../domain/dates';

export const BACKUP_VERSION = 2;
export const SUPPORTED_BACKUP_VERSIONS = [1, 2];

export type BackupFile = {
  schemaVersion: number;
  exportedAt: string;
  sessions: WorkoutSession[];
  settings: AppSettings;
  schedules: SchedulePeriod[];
};

const fail = (message: string): never => {
  throw new Error(message);
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const normalizeSession = (raw: unknown, index: number): WorkoutSession => {
  const label = `Treino ${index + 1} do backup inválido`;
  if (!isRecord(raw)) return fail(label);
  const { movements } = raw;
  if (!isString(raw.id) || !isString(raw.createdAt) || !isString(raw.startedAt) || !isString(raw.updatedAt) || !isString(raw.status) || !isString(raw.comparisonKey)) return fail(label);
  if (raw.presetId !== 'classic' && raw.presetId !== 'beginner') return fail(label);
  if (!isDate(raw.localDate)) return fail(label);
  if (!isNum(raw.durationSeconds) || !isNum(raw.completedRounds) || !isNum(raw.additionalReps) || !isNum(raw.totalReps)) return fail(label);
  if (!Array.isArray(movements) || movements.length === 0 || !movements.every((movement) => isRecord(movement) && isString(movement.key) && isString(movement.label) && isNum(movement.reps) && ['pull', 'push', 'squat'].includes(String(movement.group)))) return fail(label);

  const splits = Array.isArray(raw.roundSplitsMs) && raw.roundSplitsMs.every(isNum) ? (raw.roundSplitsMs as number[]) : [];
  const rpe = isNum(raw.rpe) && raw.rpe >= 1 && raw.rpe <= 10 ? Math.round(raw.rpe) : undefined;
  const partial = isRecord(raw.partial) && isNum(raw.partial.movementIndex) && isNum(raw.partial.reps) ? { movementIndex: raw.partial.movementIndex, reps: raw.partial.reps } : undefined;
  return {
    ...(raw as unknown as WorkoutSession),
    pausedDurationMs: isNum(raw.pausedDurationMs) ? raw.pausedDurationMs : 0,
    elapsedBeforePauseMs: isNum(raw.elapsedBeforePauseMs) ? raw.elapsedBeforePauseMs : 0,
    roundSplitsMs: splits,
    rpe,
    partial,
  };
};

const normalizeSchedule = (raw: unknown, index: number): SchedulePeriod => {
  if (!isRecord(raw) || !isString(raw.id) || !isDate(raw.effectiveFrom) || !Array.isArray(raw.weekdays) || !raw.weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
    return fail(`Calendário ${index + 1} do backup inválido`);
  }
  return { id: raw.id, effectiveFrom: raw.effectiveFrom, weekdays: raw.weekdays as number[] };
};

const normalizeSettings = (raw: unknown): AppSettings => {
  if (!isRecord(raw)) return fail('Ajustes do backup inválidos');
  return {
    onboardingComplete: typeof raw.onboardingComplete === 'boolean' ? raw.onboardingComplete : true,
    remindersEnabled: typeof raw.remindersEnabled === 'boolean' ? raw.remindersEnabled : false,
    reminderTime: typeof raw.reminderTime === 'string' && /^\d{1,2}:\d{2}$/.test(raw.reminderTime) ? raw.reminderTime : '18:00',
    trackingStartDate: isDate(raw.trackingStartDate) ? raw.trackingStartDate : localDateString(),
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true,
  };
};

/** Valida um backup v1 ou v2 e devolve sempre o formato v2. Lança Error com mensagem em PT-BR. */
export const migrateBackup = (raw: unknown): BackupFile => {
  if (!isRecord(raw) || !SUPPORTED_BACKUP_VERSIONS.includes(raw.schemaVersion as number)) {
    return fail('Este arquivo não é um backup do ICNDY compatível.');
  }
  if (!Array.isArray(raw.sessions) || !Array.isArray(raw.schedules) || !raw.settings) {
    return fail('Este arquivo não é um backup do ICNDY compatível.');
  }
  return {
    schemaVersion: BACKUP_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    sessions: raw.sessions.map(normalizeSession),
    settings: normalizeSettings(raw.settings),
    schedules: raw.schedules.map(normalizeSchedule),
  };
};

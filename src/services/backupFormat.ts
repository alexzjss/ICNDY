import { AppSettings, CompletionType, MovementOption, SchedulePeriod, WorkoutSession, WorkoutStatus } from '../domain/models';
import { comparisonKey, repsPerRound } from '../domain/presets';
import { isDateOnly, normalizeSettings } from '../domain/settings';

export const BACKUP_VERSION = 2;
export const SUPPORTED_BACKUP_VERSIONS = [1, 2];

export type BackupFile = {
  schemaVersion: number;
  exportedAt: string;
  sessions: WorkoutSession[];
  settings: AppSettings;
  schedules: SchedulePeriod[];
};

const STATUSES: WorkoutStatus[] = ['active', 'paused', 'finishing', 'completed', 'abandoned'];
const COMPLETION_TYPES: CompletionType[] = ['timer-finished', 'ended-early'];
const PRESET_IDS: WorkoutSession['presetId'][] = ['classic', 'beginner'];
const GROUPS: MovementOption['group'][] = ['pull', 'push', 'squat'];

const INCOMPATIBLE = 'Este arquivo não é um backup do ICNDY compatível.';

const fail = (message: string): never => {
  throw new Error(message);
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 500;
const isInt = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isNonNegInt = (value: unknown): value is number => isInt(value) && value >= 0;
const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isIso = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10);
};
const oneOf = <T extends string>(options: readonly T[], value: unknown): value is T => typeof value === 'string' && (options as readonly string[]).includes(value);

const normalizeMovement = (raw: unknown, label: string): MovementOption => {
  if (!isRecord(raw) || !isText(raw.key) || !isText(raw.label)) return fail(`${label}: movimento inválido.`);
  if (!isInt(raw.reps) || raw.reps < 1) return fail(`${label}: as repetições de "${raw.label}" devem ser um inteiro positivo.`);
  if (!oneOf(GROUPS, raw.group)) return fail(`${label}: grupo muscular inválido em "${raw.label}".`);
  return { key: raw.key, label: raw.label, reps: raw.reps, group: raw.group };
};

const normalizeSession = (raw: unknown, index: number): WorkoutSession => {
  const label = `Treino ${index + 1} do backup`;
  if (!isRecord(raw)) return fail(`${label} é inválido.`);
  if (!isText(raw.id)) return fail(`${label}: identificador ausente ou inválido.`);
  for (const field of ['createdAt', 'startedAt', 'updatedAt'] as const) {
    if (!isIso(raw[field])) return fail(`${label}: data "${field}" inválida (use ISO 8601 em UTC).`);
  }
  for (const field of ['finishedAt', 'pausedAt'] as const) {
    if (raw[field] != null && !isIso(raw[field])) return fail(`${label}: data "${field}" inválida (use ISO 8601 em UTC).`);
  }
  if (!isDateOnly(raw.localDate)) return fail(`${label}: dia do treino inválido (use AAAA-MM-DD).`);
  if (!oneOf(STATUSES, raw.status)) return fail(`${label}: status desconhecido.`);
  if (!oneOf(PRESET_IDS, raw.presetId)) return fail(`${label}: modelo de treino desconhecido.`);
  if (raw.completionType != null && !oneOf(COMPLETION_TYPES, raw.completionType)) return fail(`${label}: tipo de conclusão desconhecido.`);
  if (raw.notes != null && typeof raw.notes !== 'string') return fail(`${label}: anotações inválidas.`);
  if (!isInt(raw.durationSeconds) || raw.durationSeconds < 60 || raw.durationSeconds > 3600) return fail(`${label}: a duração deve ficar entre 60 e 3600 segundos.`);
  if (!Array.isArray(raw.movements) || raw.movements.length === 0) return fail(`${label}: o treino precisa de ao menos um movimento.`);
  const movements = raw.movements.map((movement) => normalizeMovement(movement, label));
  if (!isNonNegInt(raw.completedRounds) || !isNonNegInt(raw.additionalReps) || !isNonNegInt(raw.totalReps)) return fail(`${label}: rounds e repetições devem ser inteiros não negativos.`);
  for (const field of ['pausedDurationMs', 'elapsedBeforePauseMs'] as const) {
    if (raw[field] != null && !isNonNegInt(raw[field])) return fail(`${label}: "${field}" deve ser um inteiro não negativo.`);
  }

  const config = { durationSeconds: raw.durationSeconds, movements };
  const perRound = repsPerRound(config);
  if (raw.additionalReps >= perRound) return fail(`${label}: as repetições adicionais devem ser menores que as de um round (${perRound}).`);
  // totalReps e comparisonKey são derivados da configuração: recalculados em vez de rejeitar
  // backups de versões antigas com valores desatualizados.
  const key = comparisonKey(config);

  let roundSplitsMs: number[] = [];
  if (raw.roundSplitsMs != null) {
    const splits = raw.roundSplitsMs;
    if (!Array.isArray(splits) || !splits.every((split) => isNum(split) && split >= 0) || splits.some((split, i) => i > 0 && split < splits[i - 1])) {
      return fail(`${label}: os tempos por round devem ser números não negativos em ordem crescente.`);
    }
    roundSplitsMs = splits as number[];
  }

  let rpe: number | undefined;
  if (raw.rpe != null) {
    if (!isInt(raw.rpe) || raw.rpe < 1 || raw.rpe > 10) return fail(`${label}: o esforço percebido deve ser um inteiro de 1 a 10.`);
    rpe = raw.rpe;
  }

  let targetRounds: number | undefined;
  if (raw.targetRounds != null) {
    if (!isInt(raw.targetRounds) || raw.targetRounds < 1 || raw.targetRounds > 200) return fail(`${label}: a meta de rounds deve ser um inteiro de 1 a 200.`);
    targetRounds = raw.targetRounds;
  }

  let partial: WorkoutSession['partial'];
  if (raw.partial != null) {
    const value = raw.partial;
    if (!isRecord(value) || !isNonNegInt(value.movementIndex) || value.movementIndex >= movements.length) return fail(`${label}: progresso parcial inválido.`);
    if (!isNonNegInt(value.reps) || value.reps >= movements[value.movementIndex].reps) return fail(`${label}: repetições do progresso parcial fora do limite do movimento.`);
    partial = { movementIndex: value.movementIndex, reps: value.reps };
  }

  return {
    id: raw.id,
    createdAt: raw.createdAt as string,
    startedAt: raw.startedAt as string,
    finishedAt: (raw.finishedAt as string | null | undefined) ?? undefined,
    updatedAt: raw.updatedAt as string,
    status: raw.status,
    presetId: raw.presetId,
    durationSeconds: raw.durationSeconds,
    movements,
    completedRounds: raw.completedRounds,
    additionalReps: raw.additionalReps,
    totalReps: raw.completedRounds * perRound + raw.additionalReps,
    comparisonKey: key,
    completionType: (raw.completionType as CompletionType | null | undefined) ?? undefined,
    notes: (raw.notes as string | null | undefined) ?? undefined,
    localDate: raw.localDate,
    pausedAt: (raw.pausedAt as string | null | undefined) ?? undefined,
    pausedDurationMs: (raw.pausedDurationMs as number | undefined) ?? 0,
    elapsedBeforePauseMs: (raw.elapsedBeforePauseMs as number | undefined) ?? 0,
    roundSplitsMs,
    rpe,
    partial,
    targetRounds,
  };
};

const normalizeSchedule = (raw: unknown, index: number): SchedulePeriod => {
  const label = `Calendário ${index + 1} do backup`;
  if (!isRecord(raw)) return fail(`${label} é inválido.`);
  if (!isText(raw.id)) return fail(`${label}: identificador ausente ou inválido.`);
  if (!isDateOnly(raw.effectiveFrom)) return fail(`${label}: data de início inválida (use AAAA-MM-DD).`);
  const { weekdays } = raw;
  if (!Array.isArray(weekdays) || weekdays.length > 7 || !weekdays.every((day) => isInt(day) && day >= 0 && day <= 6)) return fail(`${label}: os dias da semana devem ser inteiros de 0 a 6.`);
  if (new Set(weekdays).size !== weekdays.length) return fail(`${label}: há dias da semana repetidos.`);
  return { id: raw.id, effectiveFrom: raw.effectiveFrom, weekdays: weekdays as number[] };
};

const assertUnique = (items: { id: string }[], message: string) => {
  if (new Set(items.map((item) => item.id)).size !== items.length) fail(message);
};

/** Valida um backup v1 ou v2 e devolve sempre o formato v2. Função pura; lança Error com mensagem em PT-BR. */
export const migrateBackup = (raw: unknown): BackupFile => {
  if (!isRecord(raw) || !SUPPORTED_BACKUP_VERSIONS.includes(raw.schemaVersion as number)) return fail(INCOMPATIBLE);
  if (!Array.isArray(raw.sessions) || !Array.isArray(raw.schedules) || !isRecord(raw.settings)) return fail(INCOMPATIBLE);
  if (!isIso(raw.exportedAt)) return fail('O backup contém uma data de exportação inválida.');
  const sessions = raw.sessions.map(normalizeSession);
  assertUnique(sessions, 'O backup contém identificadores de treino duplicados.');
  const schedules = raw.schedules.map(normalizeSchedule);
  assertUnique(schedules, 'O backup contém identificadores de calendário duplicados.');
  return {
    schemaVersion: BACKUP_VERSION,
    exportedAt: raw.exportedAt,
    sessions,
    settings: normalizeSettings(raw.settings),
    schedules,
  };
};

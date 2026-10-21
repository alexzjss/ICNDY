import { getDatabase } from './client';
import { AppSettings, SchedulePeriod, WorkoutSession } from '../domain/models';
import { addDays, localDateString } from '../domain/dates';
import { comparisonKey, repsPerRound, totalReps } from '../domain/scoring';

type SessionRow = Record<string, unknown>;

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapSession = (row: SessionRow): WorkoutSession => ({
  id: String(row.id), createdAt: String(row.created_at), startedAt: String(row.started_at),
  finishedAt: row.finished_at ? String(row.finished_at) : undefined, updatedAt: String(row.updated_at),
  status: row.status as WorkoutSession['status'], presetId: row.preset_id as WorkoutSession['presetId'],
  durationSeconds: Number(row.duration_seconds), movements: JSON.parse(String(row.movements_json)),
  completedRounds: Number(row.completed_rounds), additionalReps: Number(row.additional_reps),
  totalReps: Number(row.total_reps), comparisonKey: String(row.comparison_key),
  completionType: row.completion_type as WorkoutSession['completionType'] | undefined,
  notes: row.notes ? String(row.notes) : undefined, localDate: String(row.local_date),
  pausedAt: row.paused_at ? String(row.paused_at) : undefined, pausedDurationMs: Number(row.paused_duration_ms),
  elapsedBeforePauseMs: Number(row.elapsed_before_pause_ms),
  roundSplitsMs: parseJson<number[]>(row.round_splits_json, []),
  rpe: row.rpe === null || row.rpe === undefined ? undefined : Number(row.rpe),
  partial: parseJson<WorkoutSession['partial']>(row.partial_json, undefined),
});

export const listSessions = async (completedOnly = false) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(`SELECT * FROM workout_sessions ${completedOnly ? "WHERE status = 'completed'" : ''} ORDER BY created_at DESC`);
  return rows.map(mapSession);
};
export const getSession = async (id: string) => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM workout_sessions WHERE id = ?', id);
  return row ? mapSession(row) : undefined;
};
export const getActiveSession = async () => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>("SELECT * FROM workout_sessions WHERE status IN ('active', 'paused', 'finishing') ORDER BY created_at DESC LIMIT 1");
  return row ? mapSession(row) : undefined;
};
export const saveSession = async (session: WorkoutSession) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_sessions (id, created_at, started_at, finished_at, updated_at, status, preset_id, duration_seconds, movements_json, completed_rounds, additional_reps, total_reps, comparison_key, completion_type, notes, local_date, paused_at, paused_duration_ms, elapsed_before_pause_ms, round_splits_json, rpe, partial_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.createdAt, session.startedAt, session.finishedAt ?? null, session.updatedAt, session.status, session.presetId,
    session.durationSeconds, JSON.stringify(session.movements), session.completedRounds, session.additionalReps, session.totalReps,
    session.comparisonKey, session.completionType ?? null, session.notes ?? null, session.localDate, session.pausedAt ?? null,
    session.pausedDurationMs, session.elapsedBeforePauseMs,
    JSON.stringify(session.roundSplitsMs ?? []), session.rpe ?? null, session.partial ? JSON.stringify(session.partial) : null,
  );
};
/** Aplica um patch, recalcula totalReps e persiste. Retorna a sessão atualizada (ou undefined se não existe). */
export const updateSession = async (id: string, patch: Partial<Omit<WorkoutSession, 'id'>>) => {
  const current = await getSession(id);
  if (!current) return undefined;
  const merged: WorkoutSession = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
  merged.totalReps = totalReps(merged.completedRounds, merged.additionalReps, merged);
  await saveSession(merged);
  return merged;
};
export const deleteSession = async (id: string) => (await getDatabase()).runAsync('DELETE FROM workout_sessions WHERE id = ?', id);

const defaults = (): AppSettings => ({ onboardingComplete: false, remindersEnabled: false, reminderTime: '18:00', trackingStartDate: localDateString(), soundEnabled: true });
export const getSettings = async () => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  return rows.reduce((settings, row) => ({ ...settings, [row.key]: parseJson(row.value, (settings as Record<string, unknown>)[row.key]) }), defaults() as AppSettings);
};
export const saveSettings = async (settings: AppSettings) => {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(settings)) await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
  });
};
export const getSchedule = async () => {
  const rows = await (await getDatabase()).getAllAsync<{ id: string; effective_from: string; weekdays_json: string }>('SELECT * FROM training_schedule_periods ORDER BY effective_from, rowid');
  return rows.map((row) => ({ id: row.id, effectiveFrom: row.effective_from, weekdays: JSON.parse(row.weekdays_json) }) as SchedulePeriod);
};
/** Novo calendário vale a partir de amanhã; substitui um período já criado para a mesma data. */
export const saveSchedule = async (weekdays: number[]) => {
  const effectiveFrom = addDays(localDateString(), 1);
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM training_schedule_periods WHERE effective_from = ?', effectiveFrom);
    await saveSchedulePeriod({ id: `schedule-${Date.now()}`, effectiveFrom, weekdays });
  });
};
export const saveSchedulePeriod = async (period: SchedulePeriod) =>
  (await getDatabase()).runAsync('INSERT INTO training_schedule_periods (id, effective_from, weekdays_json) VALUES (?, ?, ?)', period.id, period.effectiveFrom, JSON.stringify(period.weekdays));

export const createSession = (config: WorkoutSession): WorkoutSession => ({
  ...config,
  comparisonKey: comparisonKey(config),
  totalReps: totalReps(config.completedRounds, config.additionalReps, config),
  pausedDurationMs: config.pausedDurationMs ?? 0,
  elapsedBeforePauseMs: config.elapsedBeforePauseMs ?? 0,
  roundSplitsMs: config.roundSplitsMs ?? [],
});

export const sessionRoundReps = (session: WorkoutSession) => repsPerRound(session);

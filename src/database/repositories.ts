import { getDatabase } from './client';
import { AppSettings, SchedulePeriod, WorkoutSession } from '../domain/models';
import { comparisonKey, repsPerRound, totalReps } from '../domain/scoring';
import { addDays, localDate } from '../domain/dates';

type SessionRow = Record<string, unknown>;
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
  restStartedAt: row.rest_started_at ? String(row.rest_started_at) : undefined,
  restDurationSeconds: row.rest_duration_seconds ? Number(row.rest_duration_seconds) : undefined,
});

export const listSessions = async (completedOnly = false) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(`SELECT * FROM workout_sessions ${completedOnly ? "WHERE status = 'completed'" : ''} ORDER BY created_at DESC`);
  return rows.map(mapSession);
};
export const getActiveSession = async () => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>("SELECT * FROM workout_sessions WHERE status IN ('active', 'paused', 'finishing') ORDER BY created_at DESC LIMIT 1");
  return row ? mapSession(row) : undefined;
};
export const saveSession = async (session: WorkoutSession) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_sessions (id, created_at, started_at, finished_at, updated_at, status, preset_id, duration_seconds, movements_json, completed_rounds, additional_reps, total_reps, comparison_key, completion_type, notes, local_date, paused_at, paused_duration_ms, elapsed_before_pause_ms, rest_started_at, rest_duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.createdAt, session.startedAt, session.finishedAt ?? null, session.updatedAt, session.status, session.presetId,
    session.durationSeconds, JSON.stringify(session.movements), session.completedRounds, session.additionalReps, session.totalReps,
    session.comparisonKey, session.completionType ?? null, session.notes ?? null, session.localDate, session.pausedAt ?? null,
    session.pausedDurationMs, session.elapsedBeforePauseMs, session.restStartedAt ?? null, session.restDurationSeconds ?? null,
  );
};
export const deleteSession = async (id: string) => (await getDatabase()).runAsync('DELETE FROM workout_sessions WHERE id = ?', id);

export const defaultSettings: AppSettings = {
  onboardingComplete: false, remindersEnabled: false, reminderTime: '18:00',
  trackingStartDate: localDate(), timerDisplay: 'numeric',
  workoutLayout: 'detailed', themeIntensity: 'vibrant', hapticsEnabled: true,
  soundsEnabled: true, reduceMotion: false,
};
export const normalizeSettings = (value: Partial<AppSettings> = {}): AppSettings => {
  const merged = { ...defaultSettings, ...value };
  return {
    ...merged,
    onboardingComplete: typeof merged.onboardingComplete === 'boolean' ? merged.onboardingComplete : defaultSettings.onboardingComplete,
    remindersEnabled: typeof merged.remindersEnabled === 'boolean' ? merged.remindersEnabled : defaultSettings.remindersEnabled,
    reminderTime: typeof merged.reminderTime === 'string' ? merged.reminderTime : defaultSettings.reminderTime,
    trackingStartDate: typeof merged.trackingStartDate === 'string' ? merged.trackingStartDate : defaultSettings.trackingStartDate,
    timerDisplay: merged.timerDisplay === 'circular' ? 'circular' : 'numeric',
    workoutLayout: merged.workoutLayout === 'compact' ? 'compact' : 'detailed',
    themeIntensity: merged.themeIntensity === 'discreet' || merged.themeIntensity === 'contrast' ? merged.themeIntensity : 'vibrant',
    hapticsEnabled: typeof merged.hapticsEnabled === 'boolean' ? merged.hapticsEnabled : defaultSettings.hapticsEnabled,
    soundsEnabled: typeof merged.soundsEnabled === 'boolean' ? merged.soundsEnabled : defaultSettings.soundsEnabled,
    reduceMotion: typeof merged.reduceMotion === 'boolean' ? merged.reduceMotion : defaultSettings.reduceMotion,
  };
};
export const getSettings = async () => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const stored = rows.reduce<Record<string, unknown>>((settings, row) => {
    try { settings[row.key] = JSON.parse(row.value); } catch { /* retain the safe default */ }
    return settings;
  }, {});
  return normalizeSettings(stored);
};
export const saveSettings = async (settings: AppSettings) => {
  const db = await getDatabase();
  const normalized = normalizeSettings(settings);
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(normalized)) await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
  });
  return normalized;
};
export const getSchedule = async () => {
  const rows = await (await getDatabase()).getAllAsync<{ id: string; effective_from: string; weekdays_json: string }>('SELECT * FROM training_schedule_periods ORDER BY effective_from');
  return rows.map((row) => ({ id: row.id, effectiveFrom: row.effective_from, weekdays: JSON.parse(row.weekdays_json) }) as SchedulePeriod);
};
export const saveSchedule = async (weekdays: number[]) => {
  const effectiveFrom = addDays(localDate(), 1);
  await saveSchedulePeriod({ id: `schedule-${Date.now()}`, effectiveFrom, weekdays });
};
export const saveSchedulePeriod = async (period: SchedulePeriod) =>
  (await getDatabase()).runAsync('INSERT INTO training_schedule_periods (id, effective_from, weekdays_json) VALUES (?, ?, ?)', period.id, period.effectiveFrom, JSON.stringify(period.weekdays));

export const createSession = (config: WorkoutSession): WorkoutSession => ({
  ...config,
  comparisonKey: comparisonKey(config),
  totalReps: totalReps(config.completedRounds, config.additionalReps, config),
  pausedDurationMs: config.pausedDurationMs ?? 0,
  elapsedBeforePauseMs: config.elapsedBeforePauseMs ?? 0,
});

export const sessionRoundReps = (session: WorkoutSession) => repsPerRound(session);

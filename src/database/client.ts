import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | undefined;

export const getDatabase = async () => {
  if (!database) {
    database = await SQLite.openDatabaseAsync('icndy.db');
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
        updated_at TEXT NOT NULL, status TEXT NOT NULL, preset_id TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL, movements_json TEXT NOT NULL,
        completed_rounds INTEGER NOT NULL DEFAULT 0, additional_reps INTEGER NOT NULL DEFAULT 0,
        total_reps INTEGER NOT NULL DEFAULT 0, comparison_key TEXT NOT NULL,
        completion_type TEXT, notes TEXT, local_date TEXT NOT NULL,
        paused_at TEXT, paused_duration_ms INTEGER NOT NULL DEFAULT 0,
        elapsed_before_pause_ms INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON workout_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(local_date);
      CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS training_schedule_periods (
        id TEXT PRIMARY KEY NOT NULL, effective_from TEXT NOT NULL, weekdays_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_schedule_effective ON training_schedule_periods(effective_from);
    `);
    const count = await database.getFirstAsync<{ count: number}>('SELECT COUNT(*) as count FROM training_schedule_periods');
    if (!count?.count) {
      const today = new Date().toISOString().slice(0, 10);
      await database.runAsync('INSERT INTO training_schedule_periods (id, effective_from, weekdays_json) VALUES (?, ?, ?)', `schedule-${Date.now()}`, today, JSON.stringify([1, 3, 5]));
    }
  }
  return database;
};

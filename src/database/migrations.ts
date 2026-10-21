import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = { version: number; statements: string[] };

export const MIGRATIONS: Migration[] = [
  {
    // v1: schema original (compatível com bancos existentes em user_version 0).
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
        updated_at TEXT NOT NULL, status TEXT NOT NULL, preset_id TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL, movements_json TEXT NOT NULL,
        completed_rounds INTEGER NOT NULL DEFAULT 0, additional_reps INTEGER NOT NULL DEFAULT 0,
        total_reps INTEGER NOT NULL DEFAULT 0, comparison_key TEXT NOT NULL,
        completion_type TEXT, notes TEXT, local_date TEXT NOT NULL,
        paused_at TEXT, paused_duration_ms INTEGER NOT NULL DEFAULT 0,
        elapsed_before_pause_ms INTEGER NOT NULL DEFAULT 0
      )`,
      'CREATE INDEX IF NOT EXISTS idx_sessions_status ON workout_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(local_date)',
      'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)',
      `CREATE TABLE IF NOT EXISTS training_schedule_periods (
        id TEXT PRIMARY KEY NOT NULL, effective_from TEXT NOT NULL, weekdays_json TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS idx_schedule_effective ON training_schedule_periods(effective_from)',
    ],
  },
  {
    // v2: splits por round, RPE e progresso parcial.
    version: 2,
    statements: [
      "ALTER TABLE workout_sessions ADD COLUMN round_splits_json TEXT NOT NULL DEFAULT '[]'",
      'ALTER TABLE workout_sessions ADD COLUMN rpe INTEGER',
      'ALTER TABLE workout_sessions ADD COLUMN partial_json TEXT',
    ],
  },
  {
    // v3: meta de rounds opcional.
    version: 3,
    statements: ['ALTER TABLE workout_sessions ADD COLUMN target_rounds INTEGER'],
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Passos ainda não aplicados, em ordem. */
export const pendingMigrations = (currentVersion: number, migrations: Migration[] = MIGRATIONS) =>
  [...migrations].filter((migration) => migration.version > currentVersion).sort((a, b) => a.version - b.version);

/** Aplica as migrações pendentes, cada uma em sua própria transação. */
export const runMigrations = async (db: SQLiteDatabase, migrations: Migration[] = MIGRATIONS) => {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (const migration of pendingMigrations(current, migrations)) {
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) await db.execAsync(statement);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
};

import * as SQLite from 'expo-sqlite';
import { localDateString } from '../domain/dates';
import { runMigrations } from './migrations';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

const open = async () => {
  const database = await SQLite.openDatabaseAsync('icndy.db');
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await runMigrations(database);
  const count = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM training_schedule_periods');
  if (!count?.count) {
    await database.runAsync(
      'INSERT INTO training_schedule_periods (id, effective_from, weekdays_json) VALUES (?, ?, ?)',
      `schedule-${Date.now()}`,
      localDateString(),
      JSON.stringify([1, 3, 5]),
    );
  }
  return database;
};

export const getDatabase = () => {
  if (!databasePromise) {
    databasePromise = open().catch((error) => {
      databasePromise = undefined; // permite tentar de novo
      throw error;
    });
  }
  return databasePromise;
};

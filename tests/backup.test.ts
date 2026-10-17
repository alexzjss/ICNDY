import { describe, expect, it, vi } from 'vitest';
vi.mock('expo-sqlite', () => ({}));
vi.mock('expo-document-picker', () => ({ getDocumentAsync: vi.fn() }));
vi.mock('expo-file-system/legacy', () => ({}));
vi.mock('expo-sharing', () => ({}));
import { BACKUP_VERSION, parseBackupJson, restoreBackupContents, restoreBackupData, validateBackup } from '../src/services/backup';
import { AppSettings } from '../src/domain/models';

const settings: AppSettings = {
  onboardingComplete: true, remindersEnabled: false, reminderTime: '18:00', trackingStartDate: '2026-01-01',
  timerDisplay: 'numeric', workoutLayout: 'detailed', themeIntensity: 'vibrant', hapticsEnabled: true,
  soundsEnabled: false, reduceMotion: false,
};
const session = {
  id: 'session-1', createdAt: '2026-01-01T10:00:00.000Z', startedAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:20:00.000Z', status: 'completed' as const, presetId: 'classic' as const,
  durationSeconds: 1200, movements: [
    { key: 'pull-up', label: 'Pull-ups', reps: 5, group: 'pull' as const },
    { key: 'push-up', label: 'Push-ups', reps: 10, group: 'push' as const },
    { key: 'air-squat', label: 'Air squats', reps: 15, group: 'squat' as const },
  ], completedRounds: 2, additionalReps: 3, totalReps: 63, comparisonKey: '1200:pull-up-5|push-up-10|air-squat-15',
  localDate: '2026-01-01', pausedDurationMs: 0, elapsedBeforePauseMs: 0,
};
const validBackup = () => ({
  schemaVersion: BACKUP_VERSION, exportedAt: '2026-01-02T00:00:00.000Z',
  sessions: [session], settings, schedules: [{ id: 'schedule-1', effectiveFrom: '2026-01-01', weekdays: [1, 3, 5] }],
});

describe('backup validation', () => {
  it('accepts a complete backup and fills optional settings from defaults', () => {
    const backup = validBackup();
    delete (backup.settings as Partial<AppSettings>).soundsEnabled;
    expect(validateBackup(backup).settings.soundsEnabled).toBe(false);
  });

  it.each([
    ['invalid JSON shape', null],
    ['missing sessions', { ...validBackup(), sessions: undefined }],
    ['unknown version', { ...validBackup(), schemaVersion: 99 }],
    ['inconsistent score', { ...validBackup(), sessions: [{ ...session, totalReps: 64 }] }],
    ['invalid calendar date', { ...validBackup(), sessions: [{ ...session, localDate: '2026-02-30' }] }],
  ])('rejects %s', (_name, value) => {
    expect(() => validateBackup(value)).toThrow();
  });

  it('rejects duplicate identifiers before a database operation can start', () => {
    const backup = validBackup();
    backup.sessions.push({ ...session });
    expect(() => validateBackup(backup)).toThrow(/duplicate workout session/i);
  });

  it('reports malformed JSON separately from an unsupported backup', () => {
    expect(() => parseBackupJson('{')).toThrow('not valid JSON');
  });
});

describe('backup restoration', () => {
  it('rolls back all writes when a restore operation fails', async () => {
    const state = { deleted: false, inserted: 0 };
    type FakeDatabase = {
      execAsync: () => Promise<void>;
      runAsync: () => Promise<void>;
      withExclusiveTransactionAsync: (task: (transaction: FakeDatabase) => Promise<void>) => Promise<void>;
    };
    const database: FakeDatabase = {
      execAsync: async () => { state.deleted = true; },
      runAsync: async () => { state.inserted += 1; throw new Error('disk full'); },
      withExclusiveTransactionAsync: async (task) => {
        const snapshot = { ...state };
        try { await task(database); } catch (error) { Object.assign(state, snapshot); throw error; }
      },
    };
    await expect(restoreBackupData(validateBackup(validBackup()), database as never)).rejects.toThrow('disk full');
    expect(state).toEqual({ deleted: false, inserted: 0 });
  });

  it('does not modify the database when validation fails', async () => {
    let writes = 0;
    const database = { execAsync: async () => { writes += 1; } } as never;
    await expect(restoreBackupContents({ schemaVersion: 99 }, database)).rejects.toThrow(/unsupported/i);
    expect(writes).toBe(0);
  });
});

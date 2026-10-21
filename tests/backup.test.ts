import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, migrateBackup } from '../src/services/backupFormat';
import { makeSession, period } from './fixtures';

const v1 = () => {
  const { roundSplitsMs: _splits, ...legacy } = makeSession('2025-01-06');
  void _splits;
  return {
    schemaVersion: 1,
    exportedAt: '2025-01-07T00:00:00.000Z',
    sessions: [legacy],
    settings: { onboardingComplete: true, remindersEnabled: true, reminderTime: '07:30', trackingStartDate: '2025-01-01' },
    schedules: [period('2025-01-01', [1, 3, 5])],
  };
};

describe('backup migration', () => {
  it('upgrades v1 to v2 with empty splits and default sound', () => {
    const result = migrateBackup(v1());
    expect(result.schemaVersion).toBe(BACKUP_VERSION);
    expect(result.sessions[0].roundSplitsMs).toEqual([]);
    expect(result.sessions[0].rpe).toBeUndefined();
    expect(result.settings.soundEnabled).toBe(true);
    expect(result.settings.reminderTime).toBe('07:30');
  });
  it('keeps v2 data', () => {
    const raw = { ...v1(), schemaVersion: 2, sessions: [makeSession('2025-01-06', { roundSplitsMs: [1000, 2000], rpe: 8, partial: { movementIndex: 1, reps: 4 } })] };
    const result = migrateBackup(raw);
    expect(result.sessions[0].roundSplitsMs).toEqual([1000, 2000]);
    expect(result.sessions[0].rpe).toBe(8);
    expect(result.sessions[0].partial).toEqual({ movementIndex: 1, reps: 4 });
  });
  it('rejects unsupported versions and malformed content', () => {
    expect(() => migrateBackup({ ...v1(), schemaVersion: 3 })).toThrow();
    expect(() => migrateBackup(null)).toThrow();
    expect(() => migrateBackup({ ...v1(), sessions: [{ id: 'x' }] })).toThrow();
    expect(() => migrateBackup({ ...v1(), schedules: [{ id: 'p', effectiveFrom: 'bad', weekdays: [1] }] })).toThrow();
    expect(() => migrateBackup({ ...v1(), schedules: [{ id: 'p', effectiveFrom: '2025-01-01', weekdays: [9] }] })).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, migrateBackup } from '../src/services/backupFormat';
import { PRESETS } from '../src/domain/presets';
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
    expect(result.settings.soundsEnabled).toBe(true);
    expect(result.settings.reminderTime).toBe('07:30');
  });
  it('keeps v2 data', () => {
    const raw = { ...v1(), schemaVersion: 2, sessions: [makeSession('2025-01-06', { roundSplitsMs: [1000, 2000], rpe: 8, partial: { movementIndex: 1, reps: 4 } })] };
    const result = migrateBackup(raw);
    expect(result.sessions[0].roundSplitsMs).toEqual([1000, 2000]);
    expect(result.sessions[0].rpe).toBe(8);
    expect(result.sessions[0].partial).toEqual({ movementIndex: 1, reps: 4 });
  });
  it('uses legacy soundEnabled when soundsEnabled is absent, and ignores unknown keys', () => {
    const raw = { ...v1(), settings: { ...v1().settings, soundEnabled: false, hapticsEnabled: true, themeIntensity: 'vibrant' } };
    const { settings } = migrateBackup(raw);
    expect(settings.soundsEnabled).toBe(false);
    expect(settings).not.toHaveProperty('hapticsEnabled');
    const both = migrateBackup({ ...v1(), settings: { soundEnabled: false, soundsEnabled: true } });
    expect(both.settings.soundsEnabled).toBe(true);
  });
  it('falls back to defaults for settings with the wrong type', () => {
    const { settings } = migrateBackup({ ...v1(), settings: { onboardingComplete: 'yes', reminderTime: '99:99', soundsEnabled: 1 } });
    expect(settings.onboardingComplete).toBe(false);
    expect(settings.reminderTime).toBe('18:00');
    expect(settings.soundsEnabled).toBe(true);
  });
  it('rejects unsupported versions and malformed content', () => {
    expect(() => migrateBackup({ ...v1(), schemaVersion: 3 })).toThrow('compatível');
    expect(() => migrateBackup(null)).toThrow('compatível');
    expect(() => migrateBackup({ ...v1(), sessions: [{ id: 'x' }] })).toThrow();
    expect(() => migrateBackup({ ...v1(), schedules: [{ id: 'p', effectiveFrom: 'bad', weekdays: [1] }] })).toThrow();
    expect(() => migrateBackup({ ...v1(), schedules: [{ id: 'p', effectiveFrom: '2025-01-01', weekdays: [9] }] })).toThrow();
  });
});

describe('backup strict validation', () => {
  const withSession = (overrides: Record<string, unknown>) => ({ ...v1(), schemaVersion: 2, sessions: [{ ...makeSession('2025-01-06'), ...overrides }] });
  const withSchedule = (overrides: Record<string, unknown>) => ({ ...v1(), schedules: [{ ...period('2025-01-01', [1]), ...overrides }] });
  const classic = PRESETS[0].movements;

  it.each([
    ['data ISO inválida', { createdAt: '2025-01-06 10:00' }, 'createdAt'],
    ['data inexistente', { updatedAt: '2025-02-30T10:00:00.000Z' }, 'updatedAt'],
    ['dia inválido', { localDate: '2025-02-30' }, 'dia do treino'],
    ['status desconhecido', { status: 'done' }, 'status'],
    ['preset desconhecido', { presetId: 'custom' }, 'modelo'],
    ['completionType desconhecido', { completionType: 'quit' }, 'conclusão'],
    ['duração curta', { durationSeconds: 59 }, 'duração'],
    ['duração longa', { durationSeconds: 3601 }, 'duração'],
    ['sem movimentos', { movements: [] }, 'movimento'],
    ['grupo inválido', { movements: [{ ...classic[0], group: 'core' }] }, 'grupo'],
    ['repetições zero', { movements: [{ ...classic[0], reps: 0 }] }, 'repetições'],
    ['rounds negativos', { completedRounds: -1 }, 'não negativos'],
    ['reps adicionais >= round', { additionalReps: 30, totalReps: 600 }, 'adicionais'],
    ['splits decrescentes', { roundSplitsMs: [2000, 1000] }, 'crescente'],
    ['split negativo', { roundSplitsMs: [-1] }, 'crescente'],
    ['rpe fora da faixa', { rpe: 11 }, 'esforço'],
    ['rpe fracionário', { rpe: 7.5 }, 'esforço'],
    ['parcial fora do movimento', { partial: { movementIndex: 5, reps: 0 } }, 'parcial'],
    ['parcial com reps demais', { partial: { movementIndex: 0, reps: 5 } }, 'parcial'],
  ])('rejeita treino com %s', (_name, overrides, message) => {
    expect(() => migrateBackup(withSession(overrides))).toThrow(message);
  });

  it('recalcula total e chave de comparação desatualizados', () => {
    const session = makeSession('2025-01-06');
    const [restored] = migrateBackup(withSession({ totalReps: 301, comparisonKey: 'x' })).sessions;
    expect(restored.totalReps).toBe(session.totalReps);
    expect(restored.comparisonKey).toBe(session.comparisonKey);
  });
  it('aceita rpe e parcial válidos', () => {
    expect(() => migrateBackup(withSession({ rpe: 10, partial: { movementIndex: 0, reps: 4 }, roundSplitsMs: [1000, 1000, 2500] }))).not.toThrow();
  });
  it('rejeita data de exportação inválida', () => {
    expect(() => migrateBackup({ ...v1(), exportedAt: 'ontem' })).toThrow('exportação');
  });
  it('rejeita ids de treino duplicados', () => {
    const session = makeSession('2025-01-06');
    expect(() => migrateBackup({ ...v1(), sessions: [session, { ...session }] })).toThrow('duplicados');
  });
  it('rejeita calendários inválidos', () => {
    expect(() => migrateBackup(withSchedule({ weekdays: [1, 1] }))).toThrow('repetidos');
    expect(() => migrateBackup(withSchedule({ weekdays: [-1] }))).toThrow('0 a 6');
    expect(() => migrateBackup(withSchedule({ weekdays: [1.5] }))).toThrow('0 a 6');
    expect(() => migrateBackup(withSchedule({ effectiveFrom: '2025-13-01' }))).toThrow('data de início');
    expect(() => migrateBackup({ ...v1(), schedules: [period('2025-01-01', [1]), period('2025-01-01', [2])] })).toThrow('duplicados');
  });
  it('não altera o objeto de entrada', () => {
    const raw = withSession({});
    const copy = JSON.stringify(raw);
    migrateBackup(raw);
    expect(JSON.stringify(raw)).toBe(copy);
  });
});

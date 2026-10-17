import { describe, expect, it } from 'vitest';
import { classifyCalendarDay } from '../src/domain/calendar';
import { WorkoutSession } from '../src/domain/models';

const session = (date: string, status: WorkoutSession['status'] = 'completed') => ({
  id: date, createdAt: `${date}T12:00:00.000Z`, startedAt: `${date}T12:00:00.000Z`,
  updatedAt: `${date}T12:00:00.000Z`, status, presetId: 'classic' as const, durationSeconds: 1200,
  movements: [], completedRounds: 1, additionalReps: 0, totalReps: 12, comparisonKey: 'classic',
  localDate: date, pausedDurationMs: 0, elapsedBeforePauseMs: 0,
});

describe('calendar classification', () => {
  const schedule = [{ id: 'schedule', effectiveFrom: '2026-01-01', weekdays: [1, 3, 5] }];
  it('distinguishes trained, missed and rest days', () => {
    expect(classifyCalendarDay('2026-01-05', [session('2026-01-05')], schedule)).toBe('trained');
    expect(classifyCalendarDay('2026-01-07', [], schedule)).toBe('missed');
    expect(classifyCalendarDay('2026-01-06', [], schedule)).toBe('rest');
  });
  it('does not call a future planned day missed and handles year boundaries', () => {
    expect(classifyCalendarDay('2026-01-02', [], schedule, '2025-12-31')).toBe('planned');
    expect(classifyCalendarDay('2026-01-02', [], schedule, '2026-01-03')).toBe('missed');
    expect(classifyCalendarDay('2027-01-01', [], [], '2027-01-02')).toBe('unknown');
  });
});

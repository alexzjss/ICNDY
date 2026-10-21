import { describe, expect, it } from 'vitest';
import { calculateStreaks, consistencyCalendar } from '../src/domain/streaks';
import { makeSession, period } from './fixtures';

// 2025-01-06 é segunda-feira.
describe('streaks', () => {
  const mwf = [period('2024-12-01', [1, 3, 5])];

  it('counts consecutive planned days walking back, ignoring rest days', () => {
    const sessions = ['2025-01-06', '2025-01-08', '2025-01-10'].map((d) => makeSession(d));
    expect(calculateStreaks(sessions, mwf, '2025-01-10').current).toBe(3);
    expect(calculateStreaks(sessions, mwf, '2025-01-11').current).toBe(3); // sábado de descanso
  });

  it('does not break when today is planned but not yet done', () => {
    const sessions = ['2025-01-06', '2025-01-08'].map((d) => makeSession(d));
    expect(calculateStreaks(sessions, mwf, '2025-01-10').current).toBe(2);
  });

  it('breaks on a missed planned day', () => {
    const sessions = ['2025-01-06', '2025-01-10'].map((d) => makeSession(d));
    const result = calculateStreaks(sessions, mwf, '2025-01-10');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('ignores workouts on unplanned days without breaking', () => {
    const sessions = ['2025-01-06', '2025-01-07', '2025-01-08'].map((d) => makeSession(d));
    expect(calculateStreaks(sessions, mwf, '2025-01-08').current).toBe(2);
  });

  it('works with a schedule of Mondays only (best uses the planning calendar)', () => {
    const mondays = [period('2024-12-01', [1])];
    const sessions = ['2024-12-16', '2024-12-23', '2024-12-30', '2025-01-06'].map((d) => makeSession(d));
    const result = calculateStreaks(sessions, mondays, '2025-01-08');
    expect(result.current).toBe(4);
    expect(result.best).toBe(4);
    const missed = calculateStreaks([makeSession('2024-12-16'), makeSession('2024-12-30')], mondays, '2025-01-01');
    expect(missed.best).toBe(1);
    expect(missed.current).toBe(1);
  });

  it('uses the schedule period in effect on each date', () => {
    const periods = [period('2024-12-01', [1]), period('2025-01-01', [2])];
    const sessions = [makeSession('2024-12-30'), makeSession('2025-01-07')];
    expect(calculateStreaks(sessions, periods, '2025-01-07').current).toBe(2);
  });

  it('is independent of the process timezone (pure calendar arithmetic)', () => {
    const sessions = ['2025-03-08', '2025-03-10'].map((d) => makeSession(d)); // vizinhança de DST nos EUA
    expect(calculateStreaks(sessions, [period('2025-03-01', [1, 6])], '2025-03-10').current).toBe(2);
  });

  it('builds the consistency calendar', () => {
    const days = consistencyCalendar([makeSession('2025-01-06')], mwf, '2025-01-05', '2025-01-08');
    expect(days).toEqual([
      { date: '2025-01-05', planned: false, done: false },
      { date: '2025-01-06', planned: true, done: true },
      { date: '2025-01-07', planned: false, done: false },
      { date: '2025-01-08', planned: true, done: false },
    ]);
  });
});

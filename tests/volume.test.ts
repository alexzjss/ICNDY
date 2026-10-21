import { describe, expect, it } from 'vitest';
import { nextMilestone, previousMilestone, sessionVolume, volumeTotals } from '../src/domain/volume';
import { makeSession } from './fixtures';

// classic: pull 5, push 10, squat 15
describe('volume', () => {
  it('rounds completos', () => {
    expect(sessionVolume(makeSession('2026-01-01', { completedRounds: 3, additionalReps: 0 }))).toEqual({ pull: 15, push: 30, squat: 45 });
  });
  it('parcial: movimentos anteriores completos e reps no atual', () => {
    const s = makeSession('2026-01-01', { completedRounds: 2, partial: { movementIndex: 2, reps: 7 } });
    expect(sessionVolume(s)).toEqual({ pull: 15, push: 30, squat: 37 });
  });
  it('sem parcial distribui additionalReps na ordem', () => {
    const s = makeSession('2026-01-01', { completedRounds: 0, additionalReps: 17 });
    expect(sessionVolume(s)).toEqual({ pull: 5, push: 10, squat: 2 });
  });
  it('totais filtram status e período', () => {
    const a = makeSession('2026-01-01', { completedRounds: 1 });
    const b = makeSession('2026-02-01', { completedRounds: 1 });
    const c = makeSession('2026-02-02', { completedRounds: 1, status: 'abandoned' });
    expect(volumeTotals([a, b, c]).pull).toBe(10);
    expect(volumeTotals([a, b, c], '2026-02-01', '2026-02-28').pull).toBe(5);
  });
  it('marcos', () => {
    expect(nextMilestone(0)).toBe(100);
    expect(nextMilestone(100)).toBe(250);
    expect(nextMilestone(999)).toBe(1000);
    expect(nextMilestone(5000)).toBe(10000);
    expect(nextMilestone(10000)).toBe(25000);
    expect(previousMilestone(880)).toBe(500);
    expect(previousMilestone(50)).toBe(0);
  });
});

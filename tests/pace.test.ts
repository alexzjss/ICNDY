import { describe, expect, it } from 'vitest';
import { findPersonalBest, prRoundsAt, roundDeltaMs } from '../src/domain/pace';
import { makeSession } from './fixtures';

describe('pace', () => {
  const a = makeSession('2025-01-01', { totalReps: 300 });
  const b = makeSession('2025-01-08', { totalReps: 330, roundSplitsMs: [100000, 200000, 300000] });
  it('finds the personal best for a configuration', () => {
    expect(findPersonalBest([a, b], a.comparisonKey)?.id).toBe(b.id);
    expect(findPersonalBest([a, b], a.comparisonKey, b.id)?.id).toBe(a.id);
    expect(findPersonalBest([a, b], 'other')).toBeUndefined();
    expect(findPersonalBest([makeSession('2025-01-02', { status: 'abandoned', totalReps: 999 })], a.comparisonKey)).toBeUndefined();
  });
  it('counts PR rounds at an elapsed time using splits', () => {
    expect(prRoundsAt(b, 99999)).toBe(0);
    expect(prRoundsAt(b, 100000)).toBe(1);
    expect(prRoundsAt(b, 250000)).toBe(2);
  });
  it('estimates linearly for old PRs without splits', () => {
    // 300 reps / 30 por round = 10 rounds em 1200s
    expect(prRoundsAt(a, 600000)).toBe(5);
    expect(prRoundsAt(a, 1200000)).toBe(10);
    expect(prRoundsAt(a, 9999999)).toBe(10);
  });
  it('computes the delta against the PR (negative = ahead)', () => {
    expect(roundDeltaMs({ roundSplitsMs: [90000, 210000] }, b, 0)).toBe(-10000);
    expect(roundDeltaMs({ roundSplitsMs: [90000, 210000] }, b, 1)).toBe(10000);
    expect(roundDeltaMs({ roundSplitsMs: [90000] }, b, 1)).toBeUndefined();
    expect(roundDeltaMs({ roundSplitsMs: [100000] }, a, 0)).toBe(100000 - 120000);
    expect(roundDeltaMs({ roundSplitsMs: Array(12).fill(1) }, a, 11)).toBeUndefined();
  });
});

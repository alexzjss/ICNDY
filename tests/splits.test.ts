import { describe, expect, it } from 'vitest';
import { roundDurations, splitStats } from '../src/domain/splits';

describe('splits', () => {
  it('derives round durations', () => {
    expect(roundDurations([90000, 200000, 290000])).toEqual([90000, 110000, 90000]);
    expect(roundDurations([])).toEqual([]);
  });
  it('finds best and worst round', () => {
    expect(splitStats([90000, 200000, 250000])).toEqual({ bestIndex: 2, bestMs: 50000, worstIndex: 1, worstMs: 110000 });
    expect(splitStats([])).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { isBlazing, liquidColorFor, roundDeltaVsAverageMs, roundSpeedRatio, SPEED_COLORS, speedTier } from '../src/domain/speed';

// Dois rounds de 100s e um terceiro de `last` s.
const withLast = (last: number) => [100_000, 200_000, 200_000 + last * 1000];

describe('speed', () => {
  it('has no ratio with fewer than 2 rounds', () => {
    expect(roundSpeedRatio([])).toBeUndefined();
    expect(roundSpeedRatio([90_000])).toBeUndefined();
    expect(liquidColorFor([])).toBe(SPEED_COLORS.neutral);
    expect(liquidColorFor([90_000])).toBe(SPEED_COLORS.neutral);
    expect(isBlazing([90_000])).toBe(false);
  });
  it('computes last round vs average of previous', () => {
    expect(roundSpeedRatio([100_000, 190_000])).toBeCloseTo(0.9);
    expect(roundSpeedRatio(withLast(110))).toBeCloseTo(1.1);
    expect(roundDeltaVsAverageMs(withLast(94))).toBe(-6000);
  });
  it('classifies tier boundaries', () => {
    expect(speedTier(1.15)).toBe('slower');
    expect(speedTier(1.1499)).toBe('slow');
    expect(speedTier(1.05)).toBe('slow');
    expect(speedTier(1.0499)).toBe('steady');
    expect(speedTier(0.97)).toBe('steady');
    expect(speedTier(0.9699)).toBe('fast');
    expect(speedTier(0.9)).toBe('fast');
    expect(speedTier(0.8999)).toBe('blazing');
    expect(speedTier(undefined)).toBeUndefined();
  });
  it('maps splits to colors and blazing', () => {
    expect(liquidColorFor(withLast(120))).toBe(SPEED_COLORS.slower);
    expect(liquidColorFor(withLast(89))).toBe(SPEED_COLORS.blazing);
    expect(isBlazing(withLast(89))).toBe(true);
    expect(isBlazing(withLast(100))).toBe(false);
  });
  it('recalculates on undo (dropping the last split)', () => {
    const splits = withLast(80);
    expect(liquidColorFor(splits)).toBe(SPEED_COLORS.blazing);
    expect(liquidColorFor(splits.slice(0, -1))).toBe(liquidColorFor([100_000, 200_000]));
    expect(liquidColorFor(splits.slice(0, -2))).toBe(SPEED_COLORS.neutral);
  });
  it('ignores a zero average', () => {
    expect(roundSpeedRatio([0, 5000])).toBeUndefined();
  });
});

import { targetSummary } from '../src/features/session/target';
describe('targetSummary', () => {
  it('formats hit and missed', () => {
    expect(targetSummary(undefined, 5)).toBeUndefined();
    expect(targetSummary(15, 15)?.text).toBe('Meta 15 · atingida ✓');
    expect(targetSummary(15, 17)?.hit).toBe(true);
    expect(targetSummary(15, 13)?.text).toBe('Meta 15 · faltaram 2');
    expect(targetSummary(15, 14)?.text).toBe('Meta 15 · faltou 1');
  });
});

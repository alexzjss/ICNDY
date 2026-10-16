import { describe, expect, it } from 'vitest';
import { formatScore, totalReps, validateScore } from '../src/domain/scoring';
import { PRESETS } from '../src/domain/presets';
describe('scoring', () => {
  it('calculates a round score', () => { expect(totalReps(12, 8, PRESETS[0])).toBe(368); expect(formatScore(12, 8)).toBe('12 + 8'); });
  it('rejects a partial score outside the round', () => { expect(() => validateScore(1, 30, { ...PRESETS[0], durationSeconds: PRESETS[0].durationMinutes * 60 })).toThrow(); });
});

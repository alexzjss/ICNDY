import { describe, expect, it } from 'vitest';
import { formatScore, totalReps, validateScore } from '../src/domain/scoring';
import { PRESETS } from '../src/domain/presets';
describe('scoring', () => {
  it('calculates a round score', () => { expect(totalReps(12, 8, PRESETS[0])).toBe(368); expect(formatScore(12, 8)).toBe('12 + 8'); });
  it('rejects a partial score outside the round', () => { expect(() => validateScore(1, 30, { ...PRESETS[0], durationSeconds: PRESETS[0].durationMinutes * 60 })).toThrow(); });
});

import { additionalRepsFromPartial } from '../src/domain/scoring';
import { sessionTitle } from '../src/domain/presets';
describe('partial progress', () => {
  const movements = PRESETS[0].movements; // 5 / 10 / 15
  it('sums previous movements plus current reps', () => {
    expect(additionalRepsFromPartial(movements, { movementIndex: 0, reps: 3 })).toBe(3);
    expect(additionalRepsFromPartial(movements, { movementIndex: 1, reps: 4 })).toBe(9);
    expect(additionalRepsFromPartial(movements, { movementIndex: 2, reps: 14 })).toBe(29);
  });
  it('clamps reps to the movement range', () => {
    expect(additionalRepsFromPartial(movements, { movementIndex: 0, reps: 99 })).toBe(4);
    expect(additionalRepsFromPartial(movements, { movementIndex: 1, reps: -2 })).toBe(5);
  });
  it('titles sessions', () => {
    const classic = { presetId: 'classic' as const, durationSeconds: 1200, movements: PRESETS[0].movements };
    expect(sessionTitle(classic)).toBe('Cindy Clássico');
    expect(sessionTitle({ ...classic, presetId: 'beginner', durationSeconds: 720, movements: PRESETS[1].movements })).toBe('Cindy Iniciante');
    expect(sessionTitle({ ...classic, durationSeconds: 600 })).toBe('Cindy Personalizado');
  });
});

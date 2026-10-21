import { describe, expect, it } from 'vitest';
import { PRESETS } from '../src/domain/presets';
import { additionalRepsFromPartial } from '../src/domain/scoring';
import { partialFromAdditional } from '../src/features/session/partial';
import { formatDuration } from '../src/features/session/format';

const movements = PRESETS[0].movements;

describe('partialFromAdditional', () => {
  it('mapeia reps adicionais para o movimento e é inverso de additionalRepsFromPartial', () => {
    for (let additional = 0; additional < 30; additional += 1) {
      expect(additionalRepsFromPartial(movements, partialFromAdditional(movements, additional))).toBe(additional);
    }
  });
  it('0 -> primeiro movimento, 7 -> flexão com 2', () => {
    expect(partialFromAdditional(movements, 0)).toEqual({ movementIndex: 0, reps: 0 });
    expect(partialFromAdditional(movements, 7)).toEqual({ movementIndex: 1, reps: 2 });
  });
});

describe('formatDuration', () => {
  it('formata m:ss', () => {
    expect(formatDuration(72000)).toBe('1:12');
    expect(formatDuration(-5)).toBe('0:00');
  });
});

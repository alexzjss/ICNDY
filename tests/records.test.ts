import { describe, expect, it } from 'vitest';
import { PRESETS } from '../src/domain/presets';
import { comparisonKey } from '../src/domain/scoring';
import { comparableSessions, personalBests } from '../src/domain/records';
import { makeSession } from './fixtures';

const beginner = PRESETS[1];
const other = (id: string, totalReps: number) =>
  makeSession('2026-01-01', {
    id, presetId: 'beginner', totalReps, durationSeconds: beginner.durationMinutes * 60, movements: beginner.movements,
    comparisonKey: comparisonKey({ durationSeconds: beginner.durationMinutes * 60, movements: beginner.movements }),
  });

describe('personal records', () => {
  it('selects only the highest completed result per comparable configuration', () => {
    const bests = personalBests([
      makeSession('2026-01-01', { id: 'a', totalReps: 100 }),
      makeSession('2026-01-02', { id: 'b', totalReps: 120 }),
      other('c', 999),
      makeSession('2026-01-03', { id: 'd', totalReps: 500, status: 'active' }),
    ]);
    expect(bests.map((item) => item.id)).toEqual(['b', 'c']);
  });
  it('keeps the oldest session on a tie, like findPersonalBest', () => {
    const bests = personalBests([makeSession('2026-01-01', { id: 'old', totalReps: 100 }), makeSession('2026-01-02', { id: 'new', totalReps: 100 })]);
    expect(bests.map((item) => item.id)).toEqual(['old']);
  });
  it('groups only completed sessions by comparison key', () => {
    const groups = comparableSessions([makeSession('2026-01-01'), makeSession('2026-01-02', { status: 'abandoned' }), other('x', 10)]);
    expect([...groups.values()].map((group) => group.length).sort()).toEqual([1, 1]);
  });
});

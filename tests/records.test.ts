import { describe, expect, it } from 'vitest';
import { personalBests } from '../src/domain/records';

const make = (id: string, totalReps: number, comparisonKey: string, status: 'completed' | 'active' = 'completed') => ({
  id, createdAt: id, startedAt: id, updatedAt: id, status, presetId: 'classic' as const,
  durationSeconds: 1200, movements: [], completedRounds: totalReps, additionalReps: 0, totalReps,
  comparisonKey, localDate: '2026-01-01', pausedDurationMs: 0, elapsedBeforePauseMs: 0,
});

const configured = (id: string, totalReps: number, durationSeconds: number, movementKey: string) => ({
  ...make(id, totalReps, 'stale-key'),
  durationSeconds,
  movements: [{ key: movementKey, label: movementKey, reps: 10, group: 'push' as const }],
});

describe('personal records', () => {
  it('selects only the highest completed result per comparable configuration', () => {
    const bests = personalBests([make('a', 100, 'same'), make('b', 120, 'same'), make('c', 999, 'other'), make('d', 200, 'ignored', 'active')]);
    expect(bests.map((item) => item.id)).toEqual(['b', 'c']);
  });
  it('does not compare different durations or movements', () => {
    const bests = personalBests([
      configured('same-a', 100, 1200, 'push-up'),
      configured('same-b', 120, 1200, 'push-up'),
      configured('different-duration', 999, 600, 'push-up'),
      configured('different-movement', 999, 1200, 'incline-push-up'),
    ]);
    expect(bests.map((item) => item.id)).toEqual(['same-b', 'different-duration', 'different-movement']);
  });
});

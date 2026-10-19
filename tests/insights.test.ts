import { describe, expect, it } from 'vitest';
import { getInsights } from '../src/domain/insights';

const session = (id: string, totalReps: number) => ({
  id, createdAt: id, startedAt: id, updatedAt: id, status: 'completed' as const, presetId: 'classic' as const,
  durationSeconds: 1200, movements: [], completedRounds: 1, additionalReps: 0, totalReps,
  comparisonKey: 'same', localDate: id, pausedDurationMs: 0, elapsedBeforePauseMs: 0,
});

describe('insights', () => {
  it('explains when there is not enough data and compares recent sessions otherwise', () => {
    expect(getInsights([session('2026-01-01', 100)])[0].title).toBe('Crie sua linha de base');
    expect(getInsights([session('2026-01-02', 110), session('2026-01-01', 100)])[0].detail).toContain('melhorou em 10 repetições');
  });
  it('does not invent a trend across different configurations', () => {
    const first = session('2026-01-01', 100);
    const second = { ...session('2026-01-02', 500), comparisonKey: 'different' };
    expect(getInsights([second, first])[0].title).toBe('Compare treinos parecidos');
  });
});

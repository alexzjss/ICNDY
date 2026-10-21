import { describe, expect, it } from 'vitest';
import { getInsights } from '../src/domain/insights';
import { PRESETS } from '../src/domain/presets';
import { comparisonKey } from '../src/domain/scoring';
import { makeSession } from './fixtures';

const rounds = (localDate: string, completedRounds: number, overrides = {}) =>
  makeSession(localDate, { completedRounds, totalReps: completedRounds * 30, ...overrides });

describe('insights', () => {
  it('explains when there is not enough data', () => {
    expect(getInsights([])[0].title).toBe('Crie sua linha de base');
    expect(getInsights([rounds('2026-01-01', 10)])[0].title).toBe('Crie sua linha de base');
  });
  it('compares the two latest comparable sessions', () => {
    const [trend] = getInsights([rounds('2026-01-01', 10), rounds('2026-01-02', 11)]);
    expect(trend.detail).toContain('Cindy Clássico');
    expect(trend.detail).toContain('melhorou em 30 repetições');
    expect(trend.icon).toBe('trending-up');
    expect(getInsights([rounds('2026-01-01', 11), rounds('2026-01-02', 10)])[0].icon).toBe('trending-down');
    expect(getInsights([rounds('2026-01-01', 10), rounds('2026-01-02', 10)])[0].detail).toContain('manteve o resultado');
  });
  it('does not invent a trend across different configurations', () => {
    const beginner = PRESETS[1];
    const other = makeSession('2026-01-02', {
      presetId: 'beginner', durationSeconds: beginner.durationMinutes * 60, movements: beginner.movements,
      comparisonKey: comparisonKey({ durationSeconds: beginner.durationMinutes * 60, movements: beginner.movements }),
    });
    expect(getInsights([other, rounds('2026-01-01', 10)])[0].title).toBe('Compare treinos parecidos');
  });
  it('ignores sessions that are not completed and adds consistency from three workouts', () => {
    const insights = getInsights([rounds('2026-01-01', 10), rounds('2026-01-02', 11), rounds('2026-01-03', 12), rounds('2026-01-04', 99, { status: 'active' })]);
    expect(insights.map((item) => item.title)).toEqual(['Tendência recente', 'Seus dados', 'Consistência']);
    expect(insights[0].detail).toContain('30 repetições');
    expect(insights[2].detail).toContain('3 dias');
  });
});

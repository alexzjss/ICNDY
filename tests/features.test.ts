import { describe, expect, it } from 'vitest';
import { countRecordsBroken, getAchievements, longestWeekRun } from '../src/domain/achievements';
import { currentWeek, greetingFor, pickPrimaryKey, recentResults } from '../src/features/home/logic';
import { areaPath, buildPoints, polylineLength } from '../src/features/progress/chartMath';
import { buildHeatmap, evolutionOptions, evolutionPoints, groupByMonth, prIndex } from '../src/features/progress/data';
import { makeSession, period } from './fixtures';

// 2025-01-06 é segunda-feira.
describe('achievements', () => {
  it('counts weeks in a row', () => {
    const s = ['2025-01-06', '2025-01-14', '2025-01-20', '2025-02-10'].map((d) => makeSession(d));
    expect(longestWeekRun(s)).toBe(3);
  });

  it('counts records broken per configuration, ignoring the first result', () => {
    const s = [
      makeSession('2025-01-06', { totalReps: 200, createdAt: '2025-01-06T10:00:00.000Z' }),
      makeSession('2025-01-08', { totalReps: 250, createdAt: '2025-01-08T10:00:00.000Z' }),
      makeSession('2025-01-10', { totalReps: 240, createdAt: '2025-01-10T10:00:00.000Z' }),
      makeSession('2025-01-12', { totalReps: 260, createdAt: '2025-01-12T10:00:00.000Z' }),
    ];
    expect(countRecordsBroken(s)).toBe(2);
    expect(countRecordsBroken(s.slice(0, 1))).toBe(0);
  });

  it('reports progress and earned flags', () => {
    const s = [makeSession('2025-01-06', { completedRounds: 10 }), makeSession('2025-01-07')];
    const a = Object.fromEntries(getAchievements(s, 2).map((x) => [x.id, x]));
    expect(a.first.earned).toBe(true);
    expect(a.five).toMatchObject({ earned: false, progress: 2, target: 5 });
    expect(a.rounds10.earned).toBe(true);
    expect(a.streak).toMatchObject({ earned: false, progress: 2 });
    expect(a.pr.earned).toBe(false);
  });
});

describe('home logic', () => {
  it('greets by hour', () => {
    expect([greetingFor(3), greetingFor(8), greetingFor(14), greetingFor(20)]).toEqual(['Boa noite', 'Bom dia', 'Boa tarde', 'Boa noite']);
  });

  it('builds the current week states', () => {
    const periods = [period('2024-12-01', [1, 3, 5])];
    const week = currentWeek('2025-01-08', [makeSession('2025-01-06')], periods);
    expect(week.map((d) => d.state)).toEqual(['rest', 'done', 'rest', 'today', 'rest', 'planned', 'rest']);
    expect(currentWeek('2025-01-10', [], periods)[1].state).toBe('missed');
    expect(currentWeek('2025-01-08', [makeSession('2025-01-08')], periods)[3].state).toBe('todayDone');
  });

  it('picks the classic key when present, else the latest', () => {
    expect(pickPrimaryKey([])).toBeUndefined();
    const classic = makeSession('2025-01-06');
    const other = makeSession('2025-01-07', { comparisonKey: 'x', createdAt: '2025-01-07T10:00:00.000Z' });
    expect(pickPrimaryKey([other, classic])).toBe(classic.comparisonKey);
    expect(pickPrimaryKey([other])).toBe('x');
  });

  it('returns recent results chronologically', () => {
    const s = [1, 2, 3].map((n) => makeSession(`2025-01-0${n}`, { totalReps: n * 100, createdAt: `2025-01-0${n}T10:00:00.000Z` }));
    expect(recentResults(s, s[0].comparisonKey, 2)).toEqual([200, 300]);
  });
});

describe('chart math', () => {
  it('maps values to points', () => {
    const pts = buildPoints([10, 20], 100, 50);
    expect(pts).toEqual([{ x: 0, y: 50 }, { x: 100, y: 0 }]);
    expect(buildPoints([5], 100, 50)).toEqual([{ x: 50, y: 25 }]);
    expect(buildPoints([5, 5], 100, 50).map((p) => p.y)).toEqual([25, 25]);
    expect(buildPoints([], 100, 50)).toEqual([]);
  });
  it('measures and closes paths', () => {
    expect(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5);
    expect(areaPath([{ x: 0, y: 5 }, { x: 10, y: 1 }], 20)).toBe('M0.00 5.00 L10.00 1.00 L10.00 20 L0.00 20 Z');
  });
});

describe('progress data', () => {
  it('lists evolution options and points', () => {
    const a = makeSession('2025-01-06', { totalReps: 100, createdAt: '2025-01-06T10:00:00.000Z' });
    const b = makeSession('2025-01-08', { totalReps: 150, createdAt: '2025-01-08T10:00:00.000Z' });
    const c = makeSession('2025-01-09', { comparisonKey: 'other' });
    const options = evolutionOptions([a, b, c]);
    expect(options.map((o) => o.key)).toEqual([a.comparisonKey, 'other']);
    const points = evolutionPoints([a, b, c], a.comparisonKey);
    expect(points.map((p) => p.totalReps)).toEqual([100, 150]);
    expect(prIndex(points)).toBe(1);
    expect(prIndex([])).toBe(-1);
  });

  it('builds a heatmap whose last column contains today', () => {
    const periods = [period('2024-12-01', [1, 3, 5])];
    const grid = buildHeatmap('2025-01-08', 4, [makeSession('2025-01-06')], periods);
    expect(grid).toHaveLength(4);
    expect(grid.every((col) => col.length === 7)).toBe(true);
    const last = grid[3];
    expect(last.map((c) => c.state)).toEqual(['rest', 'done', 'rest', 'rest', 'future', 'future', 'future']);
    expect(last[3].isToday).toBe(true);
    expect(grid[2][1].state).toBe('missed');
  });

  it('groups history by month', () => {
    const groups = groupByMonth([makeSession('2025-01-06'), makeSession('2025-02-02'), makeSession('2025-01-20')]);
    expect(groups.map((g) => g.label)).toEqual(['Fevereiro 2025', 'Janeiro 2025']);
    expect(groups[1].sessions.map((s) => s.localDate)).toEqual(['2025-01-20', '2025-01-06']);
  });
});

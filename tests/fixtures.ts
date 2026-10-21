import { SchedulePeriod, WorkoutSession } from '../src/domain/models';
import { PRESETS } from '../src/domain/presets';
import { comparisonKey } from '../src/domain/scoring';

export const makeSession = (localDate: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession => {
  const preset = PRESETS[0];
  const config = { durationSeconds: preset.durationMinutes * 60, movements: preset.movements };
  return {
    id: `s-${localDate}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: `${localDate}T10:00:00.000Z`, startedAt: `${localDate}T10:00:00.000Z`, updatedAt: `${localDate}T10:20:00.000Z`,
    status: 'completed', presetId: 'classic', ...config, completedRounds: 10, additionalReps: 0, totalReps: 300,
    comparisonKey: comparisonKey(config), localDate, pausedDurationMs: 0, elapsedBeforePauseMs: 0, roundSplitsMs: [],
    ...overrides,
  };
};

export const period = (effectiveFrom: string, weekdays: number[]): SchedulePeriod => ({ id: `p-${effectiveFrom}`, effectiveFrom, weekdays });

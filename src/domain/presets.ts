import { MovementOption, WorkoutConfig, WorkoutPreset } from './models';

export const MOVEMENTS: Record<string, MovementOption> = {
  pullUp: { key: 'pull-up', label: 'Pull-ups', reps: 5, group: 'pull' },
  bandPullUp: { key: 'band-pull-up', label: 'Band-assisted pull-ups', reps: 5, group: 'pull' },
  ringRow: { key: 'ring-row', label: 'Ring rows', reps: 3, group: 'pull' },
  pushUp: { key: 'push-up', label: 'Push-ups', reps: 10, group: 'push' },
  inclinePushUp: { key: 'incline-push-up', label: 'Incline push-ups', reps: 10, group: 'push' },
  kneePushUp: { key: 'knee-push-up', label: 'Knee push-ups', reps: 10, group: 'push' },
  airSquat: { key: 'air-squat', label: 'Air squats', reps: 15, group: 'squat' },
  boxSquat: { key: 'box-squat', label: 'Box squats', reps: 15, group: 'squat' },
};

export const PRESETS: WorkoutPreset[] = [
  {
    id: 'classic',
    name: 'Classic Cindy',
    description: 'The benchmark AMRAP',
    durationMinutes: 20,
    movements: [MOVEMENTS.pullUp, MOVEMENTS.pushUp, MOVEMENTS.airSquat],
  },
  {
    id: 'beginner',
    name: 'Beginner Cindy',
    description: 'A scaled, accessible AMRAP',
    durationMinutes: 12,
    movements: [MOVEMENTS.ringRow, { ...MOVEMENTS.pushUp, key: 'assisted-push-up', label: 'Assisted push-ups', reps: 6 }, { ...MOVEMENTS.airSquat, key: 'squat', label: 'Squats', reps: 9 }],
  },
];

export const getPreset = (id: WorkoutPreset['id']) => PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
export const repsPerRound = (config: Pick<WorkoutConfig, 'movements'>) => config.movements.reduce((sum, movement) => sum + movement.reps, 0);
export const comparisonKey = (config: Pick<WorkoutConfig, 'durationSeconds' | 'movements'>) =>
  `${config.durationSeconds}:${config.movements.map((movement) => `${movement.key}-${movement.reps}`).join('|')}`;

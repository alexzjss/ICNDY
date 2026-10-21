import { MovementOption, WorkoutConfig, WorkoutPreset } from './models';

export const MOVEMENTS: Record<string, MovementOption> = {
  pullUp: { key: 'pull-up', label: 'Barra fixa', reps: 5, group: 'pull' },
  bandPullUp: { key: 'band-pull-up', label: 'Barra com elástico', reps: 5, group: 'pull' },
  ringRow: { key: 'ring-row', label: 'Remada nos anéis', reps: 3, group: 'pull' },
  pushUp: { key: 'push-up', label: 'Flexão', reps: 10, group: 'push' },
  inclinePushUp: { key: 'incline-push-up', label: 'Flexão inclinada', reps: 10, group: 'push' },
  kneePushUp: { key: 'knee-push-up', label: 'Flexão com joelhos', reps: 10, group: 'push' },
  airSquat: { key: 'air-squat', label: 'Agachamento livre', reps: 15, group: 'squat' },
  boxSquat: { key: 'box-squat', label: 'Agachamento na caixa', reps: 15, group: 'squat' },
};

export const PRESETS: WorkoutPreset[] = [
  {
    id: 'classic',
    name: 'Cindy Clássico',
    description: 'O AMRAP de referência',
    durationMinutes: 20,
    movements: [MOVEMENTS.pullUp, MOVEMENTS.pushUp, MOVEMENTS.airSquat],
  },
  {
    id: 'beginner',
    name: 'Cindy Iniciante',
    description: 'Um AMRAP adaptado e acessível',
    durationMinutes: 12,
    movements: [MOVEMENTS.ringRow, { ...MOVEMENTS.pushUp, key: 'assisted-push-up', label: 'Flexão assistida', reps: 6 }, { ...MOVEMENTS.airSquat, key: 'squat', label: 'Agachamento', reps: 9 }],
  },
];

export const getPreset = (id: WorkoutPreset['id']) => PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
export const repsPerRound = (config: Pick<WorkoutConfig, 'movements'>) => config.movements.reduce((sum, movement) => sum + movement.reps, 0);
export const comparisonKey = (config: Pick<WorkoutConfig, 'durationSeconds' | 'movements'>) =>
  `${config.durationSeconds}:${config.movements.map((movement) => `${movement.key}-${movement.reps}`).join('|')}`;

const sameAsPreset = (config: Pick<WorkoutConfig, 'durationSeconds' | 'movements'>, preset: WorkoutPreset) =>
  config.durationSeconds === preset.durationMinutes * 60 &&
  config.movements.length === preset.movements.length &&
  config.movements.every((movement, index) => movement.key === preset.movements[index].key && movement.reps === preset.movements[index].reps);

/** "Cindy Clássico" / "Cindy Iniciante" / "Cindy Personalizado". */
export const sessionTitle = (config: Pick<WorkoutConfig, 'presetId' | 'durationSeconds' | 'movements'>) => {
  const preset = getPreset(config.presetId);
  return sameAsPreset(config, preset) ? preset.name : 'Cindy Personalizado';
};

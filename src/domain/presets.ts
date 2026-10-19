import { MovementOption, WorkoutConfig, WorkoutPreset } from './models';

export const MOVEMENTS: Record<string, MovementOption> = {
  pullUp: { key: 'pull-up', label: 'Barra fixa', reps: 5, group: 'pull' },
  bandPullUp: { key: 'band-pull-up', label: 'Barra fixa com elástico', reps: 5, group: 'pull' },
  ringRow: { key: 'ring-row', label: 'Remada nas argolas', reps: 3, group: 'pull' },
  pushUp: { key: 'push-up', label: 'Flexões', reps: 10, group: 'push' },
  inclinePushUp: { key: 'incline-push-up', label: 'Flexões inclinadas', reps: 10, group: 'push' },
  kneePushUp: { key: 'knee-push-up', label: 'Flexões com joelhos', reps: 10, group: 'push' },
  airSquat: { key: 'air-squat', label: 'Agachamentos livres', reps: 15, group: 'squat' },
  boxSquat: { key: 'box-squat', label: 'Agachamentos no banco', reps: 15, group: 'squat' },
};

export const PRESETS: WorkoutPreset[] = [
  {
    id: 'classic',
    name: 'Cindy Clássica',
    description: 'O benchmark AMRAP',
    durationMinutes: 20,
    movements: [MOVEMENTS.pullUp, MOVEMENTS.pushUp, MOVEMENTS.airSquat],
  },
  {
    id: 'beginner',
    name: 'Cindy Iniciante',
    description: 'Uma versão acessível do AMRAP',
    durationMinutes: 12,
    movements: [MOVEMENTS.ringRow, { ...MOVEMENTS.pushUp, key: 'assisted-push-up', label: 'Flexões assistidas', reps: 6 }, { ...MOVEMENTS.airSquat, key: 'squat', label: 'Agachamentos', reps: 9 }],
  },
];

export const getPreset = (id: WorkoutPreset['id']) => PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
const MOVEMENT_LABELS_PT: Record<string, string> = {
  'pull-up': 'Barra fixa', 'band-pull-up': 'Barra fixa com elástico', 'ring-row': 'Remada nas argolas',
  'push-up': 'Flexões', 'incline-push-up': 'Flexões inclinadas', 'knee-push-up': 'Flexões com joelhos',
  'assisted-push-up': 'Flexões assistidas', 'air-squat': 'Agachamentos livres', 'box-squat': 'Agachamentos no banco', squat: 'Agachamentos',
};
export const localizedMovementLabel = (movement: MovementOption) => MOVEMENT_LABELS_PT[movement.key] ?? movement.label;
export const repsPerRound = (config: Pick<WorkoutConfig, 'movements'>) => config.movements.reduce((sum, movement) => sum + movement.reps, 0);
export const comparisonKey = (config: Pick<WorkoutConfig, 'durationSeconds' | 'movements'>) =>
  `${config.durationSeconds}:${config.movements.map((movement) => `${movement.key}-${movement.reps}`).join('|')}`;

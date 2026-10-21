import { comparisonKey, repsPerRound } from './presets';
import { PartialProgress, WorkoutConfig } from './models';

export const validateScore = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements' | 'durationSeconds'>) => {
  const roundReps = repsPerRound(config);
  if (!Number.isInteger(rounds) || rounds < 0) throw new Error('Os rounds completos devem ser um inteiro não negativo.');
  if (!Number.isInteger(additionalReps) || additionalReps < 0 || additionalReps >= roundReps) {
    throw new Error(`As repetições adicionais devem ser um inteiro de 0 a ${roundReps - 1}.`);
  }
  if (!Number.isInteger(config.durationSeconds) || config.durationSeconds < 60 || config.durationSeconds > 3600) {
    throw new Error('A duração do treino deve ficar entre 1 e 60 minutos.');
  }
  return true;
};

export const totalReps = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements'>) =>
  rounds * repsPerRound(config) + additionalReps;
export const formatScore = (rounds: number, additionalReps: number) => `${rounds} + ${additionalReps}`;
export { comparisonKey, repsPerRound };

/**
 * Reps adicionais a partir de onde o atleta parou: movimentos anteriores contam completos
 * + reps no movimento atual (limitadas a 0..reps-1 desse movimento).
 */
export const additionalRepsFromPartial = (movements: Pick<WorkoutConfig, 'movements'>['movements'], partial: PartialProgress) => {
  const index = Math.min(Math.max(0, Math.trunc(partial.movementIndex)), Math.max(0, movements.length - 1));
  const before = movements.slice(0, index).reduce((sum, movement) => sum + movement.reps, 0);
  const max = Math.max(0, (movements[index]?.reps ?? 1) - 1);
  return before + Math.min(Math.max(0, Math.trunc(partial.reps)), max);
};

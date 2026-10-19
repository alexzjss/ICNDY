import { comparisonKey, repsPerRound } from './presets';
import { WorkoutConfig } from './models';

export const validateScore = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements' | 'durationSeconds'>) => {
  const roundReps = repsPerRound(config);
  if (!Number.isInteger(rounds) || rounds < 0) throw new Error('O número de voltas deve ser um inteiro positivo.');
  if (!Number.isInteger(additionalReps) || additionalReps < 0 || additionalReps >= roundReps) {
    throw new Error(`As repetições extras devem ser um número inteiro entre 0 e ${roundReps - 1}.`);
  }
  if (!Number.isInteger(config.durationSeconds) || config.durationSeconds < 60 || config.durationSeconds > 3600) {
    throw new Error('A duração do treino deve ser entre 1 e 60 minutos.');
  }
  return true;
};

export const totalReps = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements'>) =>
  rounds * repsPerRound(config) + additionalReps;
export const formatScore = (rounds: number, additionalReps: number) => `${rounds} + ${additionalReps}`;
export { comparisonKey, repsPerRound };

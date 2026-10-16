import { comparisonKey, repsPerRound } from './presets';
import { WorkoutConfig } from './models';

export const validateScore = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements' | 'durationSeconds'>) => {
  const roundReps = repsPerRound(config);
  if (!Number.isInteger(rounds) || rounds < 0) throw new Error('Completed rounds must be a non-negative integer.');
  if (!Number.isInteger(additionalReps) || additionalReps < 0 || additionalReps >= roundReps) {
    throw new Error(`Additional repetitions must be an integer from 0 to ${roundReps - 1}.`);
  }
  if (!Number.isInteger(config.durationSeconds) || config.durationSeconds < 60 || config.durationSeconds > 3600) {
    throw new Error('Workout duration must be between 1 and 60 minutes.');
  }
  return true;
};

export const totalReps = (rounds: number, additionalReps: number, config: Pick<WorkoutConfig, 'movements'>) =>
  rounds * repsPerRound(config) + additionalReps;
export const formatScore = (rounds: number, additionalReps: number) => `${rounds} + ${additionalReps}`;
export { comparisonKey, repsPerRound };

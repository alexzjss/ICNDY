import { MovementOption, PartialProgress } from '../../domain/models';

/** Reconstrói onde o atleta parou a partir das reps adicionais (para sessões sem `partial`). */
export const partialFromAdditional = (movements: Pick<MovementOption, 'reps'>[], additionalReps: number): PartialProgress => {
  let remaining = Math.max(0, Math.trunc(additionalReps));
  for (let index = 0; index < movements.length; index += 1) {
    const reps = movements[index].reps;
    if (remaining < reps) return { movementIndex: index, reps: remaining };
    remaining -= reps;
  }
  const last = Math.max(0, movements.length - 1);
  return { movementIndex: last, reps: Math.max(0, (movements[last]?.reps ?? 1) - 1) };
};

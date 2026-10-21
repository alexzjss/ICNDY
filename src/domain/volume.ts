import type { MovementKey, WorkoutSession } from './models';

export type VolumeByGroup = Record<MovementKey, number>;

export const emptyVolume = (): VolumeByGroup => ({ pull: 0, push: 0, squat: 0 });

/** Reps por grupo de movimento numa sessão: rounds completos + parcial (ou additionalReps na ordem dos movimentos). */
export const sessionVolume = (session: WorkoutSession): VolumeByGroup => {
  const volume = emptyVolume();
  const rounds = Math.max(0, session.completedRounds);
  for (const movement of session.movements) volume[movement.group] += rounds * movement.reps;

  const partial = session.partial;
  if (partial) {
    session.movements.forEach((movement, index) => {
      if (index < partial.movementIndex) volume[movement.group] += movement.reps;
      else if (index === partial.movementIndex) volume[movement.group] += Math.max(0, Math.min(partial.reps, movement.reps));
    });
    return volume;
  }

  let remaining = Math.max(0, session.additionalReps);
  for (const movement of session.movements) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, movement.reps);
    volume[movement.group] += take;
    remaining -= take;
  }
  return volume;
};

/** Soma o volume das sessões concluídas, opcionalmente limitado por localDate (YYYY-MM-DD, inclusivo). */
export const volumeTotals = (sessions: WorkoutSession[], from?: string, to?: string): VolumeByGroup => {
  const total = emptyVolume();
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    if (from && session.localDate < from) continue;
    if (to && session.localDate > to) continue;
    const v = sessionVolume(session);
    total.pull += v.pull;
    total.push += v.push;
    total.squat += v.squat;
  }
  return total;
};

/** Marcos: 100, 250, 500, 1000, 2500, 5000, 10000, 25000, ... */
export const nextMilestone = (total: number): number => {
  let base = 100;
  for (;;) {
    for (const mult of [1, 2.5, 5]) {
      const milestone = base * mult;
      if (total < milestone) return milestone;
    }
    base *= 10;
  }
};

/** Marco anterior (0 se ainda não passou de 100). */
export const previousMilestone = (total: number): number => {
  let prev = 0;
  let base = 100;
  for (;;) {
    for (const mult of [1, 2.5, 5]) {
      const milestone = base * mult;
      if (total < milestone) return prev;
      prev = milestone;
    }
    base *= 10;
  }
};

/** Duração de cada round a partir dos tempos acumulados. */
export const roundDurations = (splits: number[]) =>
  splits.map((split, index) => Math.max(0, split - (index === 0 ? 0 : splits[index - 1])));

/** Melhor (menor) e pior (maior) round; undefined sem splits. */
export const splitStats = (splits: number[]) => {
  const durations = roundDurations(splits);
  if (durations.length === 0) return undefined;
  let best = 0;
  let worst = 0;
  durations.forEach((duration, index) => {
    if (duration < durations[best]) best = index;
    if (duration > durations[worst]) worst = index;
  });
  return { bestIndex: best, bestMs: durations[best], worstIndex: worst, worstMs: durations[worst] };
};

/** Velocidade do round vs. ritmo do próprio treino: cor do líquido e efeitos. Puro (sem React). */
export type SpeedTier = 'slower' | 'slow' | 'steady' | 'fast' | 'blazing';

export const SPEED_COLORS = {
  slower: '#FF3B30', // >= 1.15 (vermelho)
  slow: '#FF8A00', // 1.05 a 1.15 (laranja)
  steady: '#FFD60A', // 0.97 a 1.05 (amarelo)
  fast: '#C6FF00', // 0.90 a 0.97 (lima)
  blazing: '#00FF66', // < 0.90 (verde tóxico, com efeitos)
  neutral: '#C6FF00', // sem média ainda
} as const;

export const SPEED_THRESHOLDS = { slower: 1.15, slow: 1.05, steady: 0.97, fast: 0.9 } as const;

/** Tempo de cada round (ms) a partir dos splits acumulados. */
export const roundDurations = (splits: number[]) => splits.map((split, i) => split - (i > 0 ? splits[i - 1] : 0));

/** Duração do último round ÷ média das anteriores. undefined com menos de 2 rounds ou média inválida. */
export const roundSpeedRatio = (splits: number[]): number | undefined => {
  if (splits.length < 2) return undefined;
  const last = splits[splits.length - 1] - splits[splits.length - 2];
  const mean = splits[splits.length - 2] / (splits.length - 1);
  if (!Number.isFinite(last) || !Number.isFinite(mean) || mean <= 0 || last < 0) return undefined;
  return last / mean;
};

/** Diferença (ms) do último round vs. média dos anteriores; negativo = mais rápido. */
export const roundDeltaVsAverageMs = (splits: number[]): number | undefined => {
  if (splits.length < 2) return undefined;
  const last = splits[splits.length - 1] - splits[splits.length - 2];
  const mean = splits[splits.length - 2] / (splits.length - 1);
  return Number.isFinite(last) && Number.isFinite(mean) ? last - mean : undefined;
};

export const speedTier = (ratio: number | undefined): SpeedTier | undefined => {
  if (ratio === undefined || !Number.isFinite(ratio)) return undefined;
  if (ratio >= SPEED_THRESHOLDS.slower) return 'slower';
  if (ratio >= SPEED_THRESHOLDS.slow) return 'slow';
  if (ratio >= SPEED_THRESHOLDS.steady) return 'steady';
  if (ratio >= SPEED_THRESHOLDS.fast) return 'fast';
  return 'blazing';
};

export const liquidColorFor = (splits: number[]): string => {
  const tier = speedTier(roundSpeedRatio(splits));
  return tier ? SPEED_COLORS[tier] : SPEED_COLORS.neutral;
};

export const isBlazing = (splits: number[]) => speedTier(roundSpeedRatio(splits)) === 'blazing';

/** Cor de texto legível sobre o líquido (todas as cores são claras o bastante para texto preto). */
export const LIQUID_TEXT_COLOR = '#000000';

import { WorkoutSession } from './models';
import { repsPerRound } from './presets';

type PaceSession = Pick<WorkoutSession, 'roundSplitsMs' | 'totalReps' | 'durationSeconds' | 'movements'>;

/** Melhor sessão concluída (maior totalReps) de uma configuração. Empates: a mais antiga. */
export const findPersonalBest = (sessions: WorkoutSession[], comparisonKey: string, excludeId?: string) => {
  let best: WorkoutSession | undefined;
  for (const session of sessions) {
    if (session.status !== 'completed' || session.comparisonKey !== comparisonKey || session.id === excludeId) continue;
    if (!best || session.totalReps > best.totalReps || (session.totalReps === best.totalReps && session.createdAt < best.createdAt)) best = session;
  }
  return best;
};

const estimatedSplit = (pr: PaceSession, roundIndex: number) => {
  const perRound = repsPerRound(pr);
  if (pr.totalReps <= 0 || perRound <= 0) return undefined;
  const prRounds = pr.totalReps / perRound;
  if (roundIndex + 1 > Math.floor(prRounds)) return undefined;
  return ((roundIndex + 1) / prRounds) * pr.durationSeconds * 1000;
};

/** Quantos rounds completos o PR tinha após `elapsedMs` de tempo ativo. */
export const prRoundsAt = (pr: PaceSession, elapsedMs: number) => {
  const elapsed = Math.max(0, elapsedMs);
  if (pr.roundSplitsMs && pr.roundSplitsMs.length > 0) return pr.roundSplitsMs.filter((split) => split <= elapsed).length;
  const perRound = repsPerRound(pr);
  const durationMs = pr.durationSeconds * 1000;
  if (perRound <= 0 || durationMs <= 0) return 0;
  const fraction = Math.min(1, elapsed / durationMs);
  return Math.floor((pr.totalReps / perRound) * fraction + 1e-9);
};

/**
 * Split atual - split do PR no round `roundIndex` (0-based).
 * Negativo = à frente do PR. undefined se algum dos dois não tem esse round.
 */
export const roundDeltaMs = (
  current: Pick<WorkoutSession, 'roundSplitsMs'>,
  pr: PaceSession,
  roundIndex: number,
) => {
  const mine = current.roundSplitsMs[roundIndex];
  if (mine === undefined) return undefined;
  const theirs = pr.roundSplitsMs && pr.roundSplitsMs.length > 0 ? pr.roundSplitsMs[roundIndex] : estimatedSplit(pr, roundIndex);
  if (theirs === undefined) return undefined;
  return mine - theirs;
};

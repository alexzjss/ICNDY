import { WorkoutSession } from '../../domain/models';
import { TimerState } from '../../domain/timer';

/** Converte a sessão no estado do timer (cálculo por timestamps). */
export const timerStateOf = (session: Pick<WorkoutSession, 'durationSeconds' | 'startedAt' | 'pausedAt' | 'pausedDurationMs' | 'elapsedBeforePauseMs'>): TimerState => ({
  durationMs: session.durationSeconds * 1000,
  startedAtMs: Date.parse(session.startedAt),
  pausedAtMs: session.pausedAt ? Date.parse(session.pausedAt) : undefined,
  pausedDurationMs: session.pausedDurationMs,
  elapsedBeforePauseMs: session.elapsedBeforePauseMs,
});

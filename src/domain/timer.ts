export type TimerState = {
  durationMs: number;
  startedAtMs: number;
  pausedAtMs?: number;
  pausedDurationMs: number;
  elapsedBeforePauseMs: number;
};

export const activeElapsedMs = (state: TimerState, nowMs: number) => {
  if (state.pausedAtMs !== undefined) return Math.max(0, state.elapsedBeforePauseMs);
  return Math.max(0, Math.min(state.durationMs, nowMs - state.startedAtMs - state.pausedDurationMs));
};
export const remainingMs = (state: TimerState, nowMs: number) => Math.max(0, state.durationMs - activeElapsedMs(state, nowMs));
export const isExpired = (state: TimerState, nowMs: number) => remainingMs(state, nowMs) === 0;
export const formatRemaining = (milliseconds: number) => {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

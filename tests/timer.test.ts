import { describe, expect, it } from 'vitest';
import { formatRemaining, remainingMs } from '../src/domain/timer';
describe('timer', () => {
  it('derives remaining time from timestamps', () => { expect(remainingMs({ durationMs: 1200000, startedAtMs: 1000, pausedDurationMs: 0, elapsedBeforePauseMs: 0 }, 61000)).toBe(1140000); });
  it('never displays negative time', () => { expect(formatRemaining(0)).toBe('00:00'); });
});

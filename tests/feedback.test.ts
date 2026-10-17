import { describe, expect, it } from 'vitest';
import { shouldTriggerFeedback } from '../src/domain/feedback';

describe('feedback preferences', () => {
  it('does not trigger when both feedback types are disabled', () => {
    expect(shouldTriggerFeedback('round-complete', { soundsEnabled: false, hapticsEnabled: false })).toBe(false);
  });

  it('allows enabled feedback and suppresses an immediate duplicate', () => {
    const preferences = { soundsEnabled: true, hapticsEnabled: false };
    expect(shouldTriggerFeedback('round-complete', preferences, undefined, 1000)).toBe(true);
    expect(shouldTriggerFeedback('round-complete', preferences, { event: 'round-complete', timestamp: 1000 }, 1100)).toBe(false);
    expect(shouldTriggerFeedback('round-complete', preferences, { event: 'round-complete', timestamp: 1000 }, 1300)).toBe(true);
  });

  it('allows a different event immediately', () => {
    expect(shouldTriggerFeedback('workout-finish', { soundsEnabled: true, hapticsEnabled: true }, { event: 'round-complete', timestamp: 1000 }, 1001)).toBe(true);
  });
});

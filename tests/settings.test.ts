import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../src/domain/settings';

describe('normalizeSettings', () => {
  it('returns defaults for non-objects', () => {
    expect(normalizeSettings(null).soundsEnabled).toBe(true);
    expect(normalizeSettings([]).onboardingComplete).toBe(false);
  });
  it('reads soundsEnabled written by the main branch and ignores its extra keys', () => {
    const result = normalizeSettings({ soundsEnabled: false, hapticsEnabled: false, timerDisplay: 'circular', workoutLayout: 'compact', themeIntensity: 'contrast', reduceMotion: true, onboardingComplete: true });
    expect(result).toMatchObject({ soundsEnabled: false, hapticsEnabled: false, onboardingComplete: true });
    expect(Object.keys(result).sort()).toEqual(['hapticsEnabled', 'onboardingComplete', 'reminderTime', 'remindersEnabled', 'soundsEnabled', 'trackingStartDate']);
  });
  it('falls back to the legacy soundEnabled only when soundsEnabled is missing', () => {
    expect(normalizeSettings({ soundEnabled: false }).soundsEnabled).toBe(false);
    expect(normalizeSettings({ soundEnabled: false, soundsEnabled: true }).soundsEnabled).toBe(true);
  });
  it('validates the type of each known key', () => {
    const result = normalizeSettings({ reminderTime: '25:00', trackingStartDate: '2026-02-30', remindersEnabled: 'sim' });
    expect(result.reminderTime).toBe('18:00');
    expect(result.remindersEnabled).toBe(false);
    expect(result.trackingStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

import { AppSettings } from './models';
import { localDateString } from './dates';

export const SETTING_KEYS = ['onboardingComplete', 'remindersEnabled', 'reminderTime', 'trackingStartDate', 'soundsEnabled', 'hapticsEnabled'] as const;

export const defaultSettings = (): AppSettings => ({
  onboardingComplete: false,
  remindersEnabled: false,
  reminderTime: '18:00',
  trackingStartDate: localDateString(),
  soundsEnabled: true,
  hapticsEnabled: true,
});

export const isDateOnly = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const isTime = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{1,2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours <= 23 && minutes <= 59;
};

/**
 * Valida cada chave conhecida pelo tipo e cai no padrão quando inválida.
 * Chaves desconhecidas (ex.: `themeIntensity` de APKs antigos) são ignoradas.
 * O legado `soundEnabled` só vale quando `soundsEnabled` não existe.
 */
export const normalizeSettings = (value: unknown): AppSettings => {
  const base = defaultSettings();
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return base;
  const raw = value as Record<string, unknown>;
  const sound = typeof raw.soundsEnabled === 'boolean' ? raw.soundsEnabled : typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : base.soundsEnabled;
  return {
    onboardingComplete: typeof raw.onboardingComplete === 'boolean' ? raw.onboardingComplete : base.onboardingComplete,
    remindersEnabled: typeof raw.remindersEnabled === 'boolean' ? raw.remindersEnabled : base.remindersEnabled,
    reminderTime: isTime(raw.reminderTime) ? raw.reminderTime : base.reminderTime,
    trackingStartDate: isDateOnly(raw.trackingStartDate) ? raw.trackingStartDate : base.trackingStartDate,
    soundsEnabled: sound,
    hapticsEnabled: typeof raw.hapticsEnabled === 'boolean' ? raw.hapticsEnabled : base.hapticsEnabled,
  };
};

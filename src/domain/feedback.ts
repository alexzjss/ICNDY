export type FeedbackEvent = 'round-complete' | 'workout-start' | 'workout-resume' | 'workout-finish';

export type FeedbackPreferences = {
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
};

const MIN_EVENT_INTERVAL_MS = 250;

export const shouldTriggerFeedback = (
  event: FeedbackEvent,
  preferences: FeedbackPreferences,
  lastEvent?: { event: FeedbackEvent; timestamp: number },
  now = Date.now(),
) => {
  if (!preferences.soundsEnabled && !preferences.hapticsEnabled) return false;
  if (lastEvent?.event === event && now - lastEvent.timestamp < MIN_EVENT_INTERVAL_MS) return false;
  return true;
};

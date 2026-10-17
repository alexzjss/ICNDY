import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { FeedbackEvent, FeedbackPreferences, shouldTriggerFeedback } from '../domain/feedback';

const feedbackSound = require('../../assets/audio/feedback.wav');
let sound: Audio.Sound | undefined;
let soundLoading: Promise<Audio.Sound> | undefined;
let lastEvent: { event: FeedbackEvent; timestamp: number } | undefined;
let lifecycleToken = 0;

const getSound = async () => {
  if (sound) return sound;
  if (!soundLoading) {
    const token = lifecycleToken;
    soundLoading = Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
      .then(() => Audio.Sound.createAsync(feedbackSound, { volume: 0.7 }))
      .then(({ sound: createdSound }) => {
        if (token !== lifecycleToken) {
          void createdSound.unloadAsync();
          throw new Error('Workout feedback sound was unloaded before it finished loading.');
        }
        sound = createdSound;
        soundLoading = undefined;
        return createdSound;
      })
      .catch((error) => {
        soundLoading = undefined;
        throw error;
      });
  }
  return soundLoading;
};

const playSound = async () => {
  const player = await getSound();
  await player.replayAsync();
};

export const triggerFeedback = (event: FeedbackEvent, preferences: FeedbackPreferences) => {
  const now = Date.now();
  if (!shouldTriggerFeedback(event, preferences, lastEvent, now)) return;
  lastEvent = { event, timestamp: now };

  if (preferences.hapticsEnabled) {
    void Haptics.impactAsync(
      event === 'round-complete' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
  }
  if (preferences.soundsEnabled) {
    void playSound().catch((error) => {
      console.warn('Unable to play workout feedback sound.', error);
    });
  }
};

export const unloadFeedbackSound = async () => {
  lifecycleToken += 1;
  const currentSound = sound;
  sound = undefined;
  soundLoading = undefined;
  lastEvent = undefined;
  if (currentSound) await currentSound.unloadAsync();
};

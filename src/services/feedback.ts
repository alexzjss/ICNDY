import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { FeedbackEvent, FeedbackPreferences, shouldTriggerFeedback } from '../domain/feedback';

const feedbackSounds: Record<FeedbackEvent, number> = {
  'workout-start': require('../../assets/audio/start.wav'),
  'workout-resume': require('../../assets/audio/start.wav'),
  'round-complete': require('../../assets/audio/series.wav'),
  'workout-finish': require('../../assets/audio/finish.wav'),
};
const soundEvents: FeedbackEvent[] = ['workout-start', 'round-complete', 'workout-finish'];
const sounds = new Map<FeedbackEvent, AudioPlayer>();
const soundLoading = new Map<FeedbackEvent, Promise<AudioPlayer>>();
let audioModeSetup: Promise<void> | undefined;
let lastEvent: { event: FeedbackEvent; timestamp: number } | undefined;
let lifecycleToken = 0;

const ensureAudioMode = () => {
  if (!audioModeSetup) {
    audioModeSetup = setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' })
      .catch((error) => { audioModeSetup = undefined; throw error; });
  }
  return audioModeSetup;
};

const waitUntilReady = (player: AudioPlayer) => {
  if (player.isLoaded) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let subscription: { remove: () => void } | undefined;
    const timeout = setTimeout(() => {
      subscription?.remove();
      reject(new Error('O som não ficou pronto para reprodução.'));
    }, 5000);
    subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.isLoaded) return;
      clearTimeout(timeout);
      subscription?.remove();
      resolve();
    });
  });
};

const getSound = async (event: FeedbackEvent) => {
  const cached = sounds.get(event);
  if (cached) return cached;
  let loading = soundLoading.get(event);
  if (!loading) {
    const token = lifecycleToken;
    loading = ensureAudioMode()
      .then(async () => {
        const player = createAudioPlayer(feedbackSounds[event], { updateInterval: 250 });
        player.volume = 0.72;
        try {
          await waitUntilReady(player);
          if (token !== lifecycleToken) {
            player.remove();
            throw new Error('O áudio do treino foi encerrado antes de terminar o carregamento.');
          }
          sounds.set(event, player);
          return player;
        } catch (error) {
          player.remove();
          throw error;
        }
      })
      .finally(() => soundLoading.delete(event));
    soundLoading.set(event, loading);
  }
  return loading;
};

export const prepareFeedbackSounds = async () => {
  await Promise.all(soundEvents.map((event) => getSound(event)));
};

const playSound = async (event: FeedbackEvent) => {
  const player = await getSound(event);
  await player.seekTo(0);
  player.play();
};

export const previewFeedback = (event: FeedbackEvent) => playSound(event);

export const triggerFeedback = (event: FeedbackEvent, preferences: FeedbackPreferences) => {
  const now = Date.now();
  if (!shouldTriggerFeedback(event, preferences, lastEvent, now)) return;
  lastEvent = { event, timestamp: now };

  if (preferences.hapticsEnabled) {
    void Haptics.impactAsync(
      event === 'round-complete' ? Haptics.ImpactFeedbackStyle.Rigid : Haptics.ImpactFeedbackStyle.Heavy,
    );
  }
  if (preferences.soundsEnabled) {
    void playSound(event).catch((error) => {
      console.warn('Não foi possível reproduzir o som do treino.', error);
    });
  }
};

export const unloadFeedbackSound = async () => {
  lifecycleToken += 1;
  const currentSounds = Array.from(sounds.values());
  sounds.clear();
  soundLoading.clear();
  audioModeSetup = undefined;
  lastEvent = undefined;
  currentSounds.forEach((sound) => sound.remove());
};

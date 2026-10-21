import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type BeepKind = 'short' | 'long' | 'final';

const sources: Record<BeepKind, number> = {
  short: require('../../assets/sounds/beep-short.wav'),
  long: require('../../assets/sounds/beep-long.wav'),
  final: require('../../assets/sounds/beep-final.wav'),
};

let players: Partial<Record<BeepKind, AudioPlayer>> = {};
let loaded = false;

/** Pré-carrega os players e configura o áudio (toca no silencioso e mixa com a música do usuário). Nunca lança. */
export const preloadSounds = async () => {
  if (loaded) return;
  loaded = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch {
    // áudio indisponível: segue sem som
  }
  try {
    (Object.keys(sources) as BeepKind[]).forEach((kind) => {
      players[kind] = createAudioPlayer(sources[kind]);
    });
  } catch {
    players = {};
  }
};

/** Libera os players. */
export const releaseSounds = () => {
  Object.values(players).forEach((player) => {
    try {
      player?.remove();
    } catch {
      // ignora
    }
  });
  players = {};
  loaded = false;
};

/** Toca um bipe do início. Respeita `enabled` e nunca quebra. */
export const playBeep = (kind: BeepKind, enabled = true) => {
  if (!enabled) return;
  const player = players[kind];
  if (!player) return;
  try {
    void player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // ignora falhas de áudio
  }
};

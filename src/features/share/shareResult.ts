import { RefObject } from 'react';
import { PixelRatio, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { calculateStreaks } from '../../domain/streaks';
import type { SchedulePeriod, WorkoutSession } from '../../domain/models';
import { localDateString } from '../../domain/dates';
import { CARD_RATIO } from './ResultShareCard';

/** Largura lógica que produz 1080px de largura no aparelho. */
export const captureWidth = () => 1080 / PixelRatio.get();

/** Captura o card (PNG 1080x1350) e abre o menu de compartilhamento. Lança Error com mensagem amigável. */
export const shareResultCard = async (ref: RefObject<View | null>) => {
  if (!ref.current) throw new Error('Prévia ainda não está pronta.');
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  const width = captureWidth();
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width, height: width * CARD_RATIO });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar resultado', UTI: 'public.png' });
};

/** Streak atual considerando a sessão (mesmo se ainda não salva) como concluída. */
export const streakIncluding = (sessions: WorkoutSession[], schedule: SchedulePeriod[], session: WorkoutSession) => {
  const others = sessions.filter((item) => item.id !== session.id);
  const today = localDateString();
  return calculateStreaks([...others, { ...session, status: 'completed' }], schedule, today).current;
};

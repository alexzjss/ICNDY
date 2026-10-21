import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_PREFIX = 'reminder-';
const WORKOUT_END_ID = 'workout-end';
const reminderId = (weekday: number) => `${REMINDER_PREFIX}${weekday}`;

const ensureChannels = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('training', { name: 'Lembretes de treino', importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.setNotificationChannelAsync('workout', { name: 'Fim do treino', importance: Notifications.AndroidImportance.HIGH });
};

export const requestNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
};

/** Cancela somente os lembretes de treino (não toca em outras notificações). */
export const cancelReminders = async () => {
  await Promise.all([0, 1, 2, 3, 4, 5, 6].map((weekday) => Notifications.cancelScheduledNotificationAsync(reminderId(weekday)).catch(() => undefined)));
};

/** Reagenda lembretes semanais. weekdays usa 0 = domingo ... 6 = sábado. */
export const scheduleReminders = async (weekdays: number[], time: string) => {
  await cancelReminders();
  await ensureChannels();
  const [hour, minute] = time.split(':').map(Number);
  for (const weekday of weekdays) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(weekday),
      content: { title: 'ICNDY · dia de treino', body: 'Seu Cindy planejado está te esperando.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekday + 1, hour, minute, channelId: 'training' },
    });
  }
};

/** Liga/desliga lembretes. Retorna true se ficaram agendados. */
export const updateTrainingReminders = async (enabled: boolean, weekdays: number[], time: string) => {
  if (!enabled) {
    await cancelReminders();
    return false;
  }
  if (!(await requestNotificationPermission())) {
    await cancelReminders();
    return false;
  }
  await scheduleReminders(weekdays, time);
  return true;
};

/** Agenda "Tempo!" para o instante em que o treino acaba (app indo para background). */
export const scheduleWorkoutEnd = async (endAtMs: number) => {
  if (endAtMs <= Date.now()) return false;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_END_ID,
    content: { title: 'Tempo!', body: 'Registre seu resultado.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endAtMs), channelId: 'workout' },
  });
  return true;
};

export const cancelWorkoutEnd = async () => {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_END_ID).catch(() => undefined);
};

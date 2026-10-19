import * as Notifications from 'expo-notifications';

export const updateTrainingReminders = async (enabled: boolean, weekdays: number[], time: string) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  if (Notifications.setNotificationChannelAsync) {
    await Notifications.setNotificationChannelAsync('training', { name: 'Lembretes de treino', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const [hour, minute] = time.split(':').map(Number);
  for (const weekday of weekdays) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'ICNDY / dia de treino', body: 'Seu treino planejado está esperando por você.' },
      trigger: { weekday: weekday === 0 ? 1 : weekday + 1, hour, minute, repeats: true, channelId: 'training' },
    });
  }
  return true;
};

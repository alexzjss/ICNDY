import { WorkoutSession } from './models';
export const getAchievements = (sessions: WorkoutSession[], bestStreak: number) => {
  const completed = sessions.filter((session) => session.status === 'completed');
  return [
    { id: 'first', label: 'Primeira volta', detail: 'Conclua seu primeiro treino', earned: completed.length >= 1 },
    { id: 'five', label: 'Encontrou o ritmo', detail: 'Conclua 5 treinos', earned: completed.length >= 5 },
    { id: 'ten', label: 'No foco', detail: 'Conclua 10 treinos', earned: completed.length >= 10 },
    { id: 'twenty-five', label: 'Compromisso', detail: 'Conclua 25 treinos', earned: completed.length >= 25 },
    { id: 'fifty', label: 'Imparável', detail: 'Conclua 50 treinos', earned: completed.length >= 50 },
    { id: 'streak', label: 'Consistência', detail: 'Mantenha 3 dias de treino planejados', earned: bestStreak >= 3 },
  ];
};

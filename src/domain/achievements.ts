import { WorkoutSession } from './models';
export const getAchievements = (sessions: WorkoutSession[], bestStreak: number) => {
  const completed = sessions.filter((session) => session.status === 'completed');
  return [
    { id: 'first', label: 'First rep', detail: 'Complete your first workout', earned: completed.length >= 1 },
    { id: 'five', label: 'Finding rhythm', detail: 'Complete 5 workouts', earned: completed.length >= 5 },
    { id: 'ten', label: 'Locked in', detail: 'Complete 10 workouts', earned: completed.length >= 10 },
    { id: 'twenty-five', label: 'Committed', detail: 'Complete 25 workouts', earned: completed.length >= 25 },
    { id: 'fifty', label: 'Unstoppable', detail: 'Complete 50 workouts', earned: completed.length >= 50 },
    { id: 'streak', label: 'Consistency', detail: 'Build a 3-day planned streak', earned: bestStreak >= 3 },
  ];
};

import { WorkoutSession } from './models';
import { addDays, localDate } from './dates';
import { completedSessions } from './records';

export type VolumePoint = { date: string; totalReps: number };

export const volumeByDay = (sessions: WorkoutSession[], days: number, endDate = localDate()): VolumePoint[] => {
  const completed = completedSessions(sessions);
  const totals = new Map<string, number>();
  completed.forEach((session) => totals.set(session.localDate, (totals.get(session.localDate) ?? 0) + session.totalReps));
  const start = addDays(endDate, -(days - 1));
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    return { date, totalReps: totals.get(date) ?? 0 };
  });
};

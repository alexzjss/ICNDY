import { SchedulePeriod, WorkoutSession } from './models';
import { localDate, parseLocalDate } from './dates';

const weekday = (date: string) => parseLocalDate(date).getDay();
const scheduleFor = (date: string, periods: SchedulePeriod[]) =>
  [...periods].filter((period) => period.effectiveFrom <= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];

export type CalendarDay = 'trained' | 'planned' | 'missed' | 'rest' | 'unknown';
export const classifyCalendarDay = (date: string, sessions: WorkoutSession[], periods: SchedulePeriod[], today = localDate()): CalendarDay => {
  const schedule = scheduleFor(date, periods);
  if (!schedule) return 'unknown';
  const planned = schedule.weekdays.includes(weekday(date));
  const trained = sessions.some((session) => session.localDate === date && session.status === 'completed');
  if (trained) return 'trained';
  if (!planned) return 'rest';
  return date < today ? 'missed' : 'planned';
};

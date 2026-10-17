import { SchedulePeriod, WorkoutSession } from './models';
import { addDays, parseLocalDate } from './dates';

const weekday = (date: string) => parseLocalDate(date).getDay();
const scheduleFor = (date: string, periods: SchedulePeriod[]) =>
  [...periods].filter((period) => period.effectiveFrom <= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];

export const completedPlannedDates = (sessions: WorkoutSession[], periods: SchedulePeriod[]) => {
  const dates = new Set<string>();
  sessions.filter((session) => session.status === 'completed').forEach((session) => {
    const schedule = scheduleFor(session.localDate, periods);
    if (schedule?.weekdays.includes(weekday(session.localDate))) dates.add(session.localDate);
  });
  return dates;
};

export const calculateStreaks = (sessions: WorkoutSession[], periods: SchedulePeriod[], today: string) => {
  const completed = completedPlannedDates(sessions, periods);
  let current = 0;
  let cursor = today;
  const firstScheduleDate = [...periods].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0]?.effectiveFrom ?? today;
  while (cursor >= firstScheduleDate) {
    const schedule = scheduleFor(cursor, periods);
    const isPlanned = schedule?.weekdays.includes(weekday(cursor)) ?? false;
    if (isPlanned) {
      if (completed.has(cursor)) current += 1;
      else break;
    }
    cursor = addDays(cursor, -1);
  }
  const allDates = [...completed].sort();
  let best = 0;
  let run = 0;
  if (allDates.length) {
    let cursorDate = allDates[0];
    const lastDate = allDates[allDates.length - 1];
    while (cursorDate <= lastDate) {
      const schedule = scheduleFor(cursorDate, periods);
      if (schedule?.weekdays.includes(weekday(cursorDate))) {
        if (completed.has(cursorDate)) {
          run += 1;
          best = Math.max(best, run);
        } else {
          run = 0;
        }
      }
      cursorDate = addDays(cursorDate, 1);
    }
  }
  return { current, best, completedDates: completed };
};

import { SchedulePeriod, WorkoutSession } from './models';

const dateValue = (date: string) => new Date(`${date}T12:00:00`).getTime();
const dayBefore = (date: string) => new Date(dateValue(date) - 86400000).toISOString().slice(0, 10);
const weekday = (date: string) => new Date(dateValue(date)).getDay();
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
  while (true) {
    const schedule = scheduleFor(cursor, periods);
    const isPlanned = schedule?.weekdays.includes(weekday(cursor)) ?? false;
    if (isPlanned) {
      if (completed.has(cursor)) current += 1;
      else if (cursor !== today || dateValue(today) < dateValue(new Date().toISOString().slice(0, 10))) break;
    }
    cursor = dayBefore(cursor);
    if (dateValue(today) - dateValue(cursor) > 366 * 86400000) break;
  }
  const allDates = [...completed].sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of allDates) {
    const schedule = scheduleFor(date, periods);
    const planned = schedule?.weekdays.includes(weekday(date)) ?? false;
    if (!planned) continue;
    if (previous && dateValue(date) - dateValue(previous) <= 3 * 86400000) run += 1;
    else run = 1;
    best = Math.max(best, run);
    previous = date;
  }
  return { current, best, completedDates: completed };
};

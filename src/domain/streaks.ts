import { addDays, diffDays, weekdayOf } from './dates';
import { SchedulePeriod, WorkoutSession } from './models';

const scheduleFor = (date: string, periods: SchedulePeriod[]) => {
  let found: SchedulePeriod | undefined;
  for (const period of periods) {
    if (period.effectiveFrom <= date && (!found || period.effectiveFrom >= found.effectiveFrom)) found = period;
  }
  return found;
};

export const isPlannedDate = (date: string, periods: SchedulePeriod[]) =>
  scheduleFor(date, periods)?.weekdays.includes(weekdayOf(date)) ?? false;

const completedDates = (sessions: WorkoutSession[]) =>
  new Set(sessions.filter((session) => session.status === 'completed').map((session) => session.localDate));

/** Datas planejadas em que houve treino concluído. */
export const completedPlannedDates = (sessions: WorkoutSession[], periods: SchedulePeriod[]) =>
  new Set([...completedDates(sessions)].filter((date) => isPlannedDate(date, periods)));

/**
 * current: dias planejados consecutivos concluídos indo para trás a partir de hoje
 *   (hoje planejado e ainda não feito não quebra). Treino em dia não planejado não conta nem quebra.
 * best: maior sequência de dias planejados consecutivos concluídos.
 */
export const calculateStreaks = (sessions: WorkoutSession[], periods: SchedulePeriod[], today: string) => {
  const done = completedDates(sessions);
  const completed = completedPlannedDates(sessions, periods);
  if (periods.length === 0) return { current: 0, best: 0, completedDates: completed };

  const earliest = periods.reduce((min, period) => (period.effectiveFrom < min ? period.effectiveFrom : min), periods[0].effectiveFrom);

  let current = 0;
  for (let cursor = today; cursor >= earliest; cursor = addDays(cursor, -1)) {
    if (!isPlannedDate(cursor, periods)) continue;
    if (done.has(cursor)) current += 1;
    else if (cursor !== today) break;
  }

  let best = 0;
  let run = 0;
  const span = diffDays(earliest, today);
  for (let offset = 0; offset <= span; offset += 1) {
    const date = addDays(earliest, offset);
    if (!isPlannedDate(date, periods)) continue;
    if (done.has(date)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return { current, best: Math.max(best, current), completedDates: completed };
};

export type ConsistencyDay = { date: string; planned: boolean; done: boolean };

/** Um item por dia de fromDate a toDate (inclusive) para o heatmap. */
export const consistencyCalendar = (
  sessions: WorkoutSession[],
  periods: SchedulePeriod[],
  fromDate: string,
  toDate: string,
): ConsistencyDay[] => {
  const done = completedDates(sessions);
  const days: ConsistencyDay[] = [];
  const span = diffDays(fromDate, toDate);
  for (let offset = 0; offset <= span; offset += 1) {
    const date = addDays(fromDate, offset);
    days.push({ date, planned: isPlannedDate(date, periods), done: done.has(date) });
  }
  return days;
};

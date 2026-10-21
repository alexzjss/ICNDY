import { addDays, weekdayOf } from '../../domain/dates';
import { SchedulePeriod, WorkoutSession } from '../../domain/models';
import { getPreset } from '../../domain/presets';
import { isPlannedDate } from '../../domain/streaks';
import { comparisonKey } from '../../domain/scoring';

/** Saudação por horário (0-23). */
export const greetingFor = (hour: number) => (hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite');

export const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export type WeekDayState = 'done' | 'today' | 'todayDone' | 'planned' | 'missed' | 'rest';
export type WeekDay = { date: string; weekday: number; letter: string; planned: boolean; done: boolean; isToday: boolean; state: WeekDayState };

/** Os 7 dias (dom-sáb) da semana que contém `today`. */
export const currentWeek = (today: string, sessions: WorkoutSession[], periods: SchedulePeriod[]): WeekDay[] => {
  const doneDates = new Set(sessions.filter((session) => session.status === 'completed').map((session) => session.localDate));
  const start = addDays(today, -weekdayOf(today));
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const planned = isPlannedDate(date, periods);
    const done = doneDates.has(date);
    const isToday = date === today;
    let state: WeekDayState;
    if (isToday) state = done ? 'todayDone' : 'today';
    else if (done) state = 'done';
    else if (planned) state = date < today ? 'missed' : 'planned';
    else state = 'rest';
    return { date, weekday: index, letter: WEEKDAY_LETTERS[index], planned, done, isToday, state };
  });
};

/** Chave da configuração em destaque: Cindy Clássico se já houve treino, senão a última usada. */
export const pickPrimaryKey = (sessions: WorkoutSession[]): string | undefined => {
  const completed = sessions.filter((session) => session.status === 'completed');
  if (completed.length === 0) return undefined;
  const classic = getPreset('classic');
  const classicKey = comparisonKey({ durationSeconds: classic.durationMinutes * 60, movements: classic.movements });
  if (completed.some((session) => session.comparisonKey === classicKey)) return classicKey;
  return [...completed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].comparisonKey;
};

/** Resultados (totalReps) cronológicos de uma configuração; no máximo `limit` últimos. */
export const recentResults = (sessions: WorkoutSession[], key: string, limit = 8) =>
  sessions
    .filter((session) => session.status === 'completed' && session.comparisonKey === key)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit)
    .map((session) => session.totalReps);

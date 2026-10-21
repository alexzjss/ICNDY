import { addDays, weekdayOf } from '../../domain/dates';
import { SchedulePeriod, WorkoutSession } from '../../domain/models';
import { repsPerRound, sessionTitle } from '../../domain/presets';
import { consistencyCalendar } from '../../domain/streaks';

const completedOf = (sessions: WorkoutSession[]) => sessions.filter((session) => session.status === 'completed');

export type EvolutionOption = { key: string; label: string; detail: string; count: number; lastAt: string };
export type EvolutionPoint = { id: string; date: string; totalReps: number };

/** Configurações com treinos concluídos; a mais usada (e mais recente) primeiro. */
export const evolutionOptions = (sessions: WorkoutSession[]): EvolutionOption[] => {
  const groups = new Map<string, WorkoutSession[]>();
  for (const session of completedOf(sessions)) groups.set(session.comparisonKey, [...(groups.get(session.comparisonKey) ?? []), session]);
  return [...groups.entries()]
    .map(([key, list]) => {
      const latest = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return {
        key,
        label: sessionTitle(latest),
        detail: `${Math.round(latest.durationSeconds / 60)} min · ${repsPerRound(latest)} reps/round`,
        count: list.length,
        lastAt: latest.createdAt,
      };
    })
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
};

export const evolutionPoints = (sessions: WorkoutSession[], key: string): EvolutionPoint[] =>
  completedOf(sessions)
    .filter((session) => session.comparisonKey === key)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((session) => ({ id: session.id, date: session.localDate, totalReps: session.totalReps }));

/** Índice do PR (maior total; empate = o mais antigo) ou -1. */
export const prIndex = (points: EvolutionPoint[]) => {
  let best = -1;
  points.forEach((point, index) => {
    if (best === -1 || point.totalReps > points[best].totalReps) best = index;
  });
  return best;
};

export type HeatCell = { date: string; state: 'done' | 'missed' | 'rest' | 'future'; isToday: boolean };

/** Grade do heatmap: `weeks` colunas (dom-sáb), a última contendo hoje. */
export const buildHeatmap = (today: string, weeks: number, sessions: WorkoutSession[], periods: SchedulePeriod[]): HeatCell[][] => {
  const lastWeekStart = addDays(today, -weekdayOf(today));
  const from = addDays(lastWeekStart, -7 * (weeks - 1));
  const to = addDays(lastWeekStart, 6);
  const days = consistencyCalendar(sessions, periods, from, to);
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    columns.push(
      days.slice(w * 7, w * 7 + 7).map((day) => ({
        date: day.date,
        isToday: day.date === today,
        state: day.date > today ? 'future' : day.done ? 'done' : day.planned && day.date < today ? 'missed' : 'rest',
      })),
    );
  }
  return columns;
};

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export type MonthGroup = { key: string; label: string; sessions: WorkoutSession[] };

/** Agrupa por mês (mais recente primeiro), preservando a ordem decrescente dentro do mês. */
export const groupByMonth = (sessions: WorkoutSession[]): MonthGroup[] => {
  const ordered = [...completedOf(sessions)].sort((a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt));
  const groups: MonthGroup[] = [];
  for (const session of ordered) {
    const key = session.localDate.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const [year, month] = key.split('-').map(Number);
      group = { key, label: `${MONTHS_FULL[month - 1]} ${year}`, sessions: [] };
      groups.push(group);
    }
    group.sessions.push(session);
  }
  return groups;
};

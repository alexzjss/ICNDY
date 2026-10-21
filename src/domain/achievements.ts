import { addDays, diffDays, weekdayOf } from './dates';
import { WorkoutSession } from './models';

export type Achievement = {
  id: string;
  label: string;
  detail: string;
  /** Nome de ícone Ionicons. */
  icon: string;
  earned: boolean;
  /** Progresso atual (limitado ao alvo). */
  progress: number;
  target: number;
};

const completedOf = (sessions: WorkoutSession[]) => sessions.filter((session) => session.status === 'completed');

/** Início (domingo) da semana de uma data YYYY-MM-DD. */
export const weekStartOf = (date: string) => addDays(date, -weekdayOf(date));

/** Maior sequência de semanas (dom-sáb) consecutivas com ao menos um treino concluído. */
export const longestWeekRun = (sessions: WorkoutSession[]) => {
  const weeks = [...new Set(completedOf(sessions).map((session) => weekStartOf(session.localDate)))].sort();
  let best = 0;
  let run = 0;
  weeks.forEach((week, index) => {
    run = index > 0 && diffDays(weeks[index - 1], week) === 7 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};

/** Quantas vezes um treino superou o melhor anterior da mesma configuração (o primeiro não conta). */
export const countRecordsBroken = (sessions: WorkoutSession[]) => {
  const ordered = [...completedOf(sessions)].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const bestByKey = new Map<string, number>();
  let broken = 0;
  for (const session of ordered) {
    const previous = bestByKey.get(session.comparisonKey);
    if (previous !== undefined && session.totalReps > previous) broken += 1;
    if (previous === undefined || session.totalReps > previous) bestByKey.set(session.comparisonKey, session.totalReps);
  }
  return broken;
};

export const getAchievements = (sessions: WorkoutSession[], bestStreak: number): Achievement[] => {
  const completed = completedOf(sessions);
  const count = completed.length;
  const maxRounds = completed.reduce((max, session) => Math.max(max, session.completedRounds), 0);
  const records = countRecordsBroken(sessions);
  const weekRun = longestWeekRun(sessions);
  const make = (id: string, label: string, detail: string, icon: string, value: number, target: number): Achievement => ({
    id,
    label,
    detail,
    icon,
    earned: value >= target,
    progress: Math.min(value, target),
    target,
  });
  return [
    make('first', 'Primeira repetição', 'Conclua seu primeiro treino', 'flag', count, 1),
    make('five', 'Pegando o ritmo', 'Conclua 5 treinos', 'speedometer', count, 5),
    make('ten', 'Focado', 'Conclua 10 treinos', 'locate', count, 10),
    make('twenty-five', 'Comprometido', 'Conclua 25 treinos', 'ribbon', count, 25),
    make('fifty', 'Imparável', 'Conclua 50 treinos', 'trophy', count, 50),
    make('streak', 'Consistência', 'Faça 3 dias planejados seguidos', 'flame', bestStreak, 3),
    make('weeks', 'Hábito formado', 'Treine em 4 semanas seguidas', 'calendar', weekRun, 4),
    make('rounds10', 'Máquina de rounds', 'Complete 10 rounds em um treino', 'repeat', maxRounds, 10),
    make('pr', 'Novo recorde', 'Bata seu PR em uma configuração', 'medal', records, 1),
  ];
};

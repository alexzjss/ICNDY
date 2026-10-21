import { WorkoutSession } from './models';
import { findPersonalBest } from './pace';

export const completedSessions = (sessions: WorkoutSession[]) => sessions.filter((session) => session.status === 'completed');

/** Treinos concluídos agrupados por configuração comparável (`comparisonKey`). */
export const comparableSessions = (sessions: WorkoutSession[]) => {
  const groups = new Map<string, WorkoutSession[]>();
  for (const session of completedSessions(sessions)) groups.set(session.comparisonKey, [...(groups.get(session.comparisonKey) ?? []), session]);
  return groups;
};

/** O melhor treino concluído de cada configuração (reutiliza `findPersonalBest`). */
export const personalBests = (sessions: WorkoutSession[]) =>
  [...comparableSessions(sessions).keys()].flatMap((key) => findPersonalBest(sessions, key) ?? []);

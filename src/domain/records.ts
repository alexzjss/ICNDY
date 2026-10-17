import { WorkoutSession } from './models';
import { comparisonKey } from './presets';

export const completedSessions = (sessions: WorkoutSession[]) => sessions.filter((session) => session.status === 'completed');
const comparableKey = (session: WorkoutSession) =>
  session.movements.length ? comparisonKey(session) : session.comparisonKey;

export const personalBests = (sessions: WorkoutSession[]) => {
  const groups = completedSessions(sessions).reduce<Record<string, WorkoutSession[]>>((all, session) => {
    (all[comparableKey(session)] ??= []).push(session);
    return all;
  }, {});
  return Object.values(groups).map((group) => group.reduce((best, session) =>
    session.totalReps > best.totalReps || (session.totalReps === best.totalReps && session.localDate > best.localDate) ? session : best,
  ));
};

export const comparableSessions = (sessions: WorkoutSession[]) => {
  const groups = new Map<string, WorkoutSession[]>();
  completedSessions(sessions).forEach((session) => {
    const key = comparableKey(session);
    groups.set(key, [...(groups.get(key) ?? []), session]);
  });
  return groups;
};

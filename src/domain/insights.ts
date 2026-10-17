import { WorkoutSession } from './models';
import { comparableSessions, completedSessions } from './records';

export type Insight = { title: string; detail: string };
export const getInsights = (sessions: WorkoutSession[]): Insight[] => {
  const completed = [...completedSessions(sessions)].sort((a, b) => b.localDate.localeCompare(a.localDate));
  if (completed.length < 2) return [{ title: 'Build your baseline', detail: 'Complete one more workout to unlock a meaningful performance trend.' }];
  const comparable = [...comparableSessions(completed).values()]
    .filter((group) => group.length >= 2)
    .sort((a, b) => b[b.length - 1].localDate.localeCompare(a[a.length - 1].localDate))[0];
  if (!comparable) return [{ title: 'More comparable data needed', detail: `${completed.length} completed sessions are recorded, but they use different workout configurations.` }];
  const ordered = [...comparable].sort((a, b) => b.localDate.localeCompare(a.localDate));
  const delta = ordered[0].totalReps - ordered[1].totalReps;
  const direction = delta === 0 ? 'held steady' : delta > 0 ? `improved by ${delta} reps` : `changed by ${delta} reps`;
  const insights: Insight[] = [
    { title: 'Latest trend', detail: `Your latest comparable result ${direction} versus the previous completed session.` },
    { title: 'Training sample', detail: `${completed.length} completed sessions are included in your local insights.` },
  ];
  if (completed.length >= 3) {
    const activeDates = new Set(completed.map((session) => session.localDate));
    insights.push({ title: 'Consistency', detail: `${activeDates.size} training days are represented in your history.` });
  }
  return insights;
};

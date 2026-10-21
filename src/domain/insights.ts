import { WorkoutSession } from './models';
import { sessionTitle } from './presets';
import { comparableSessions, completedSessions } from './records';

export type Insight = { title: string; detail: string; icon: 'trending-up' | 'trending-down' | 'remove' | 'flag' | 'copy' | 'calendar' | 'barbell' };

const newestFirst = (a: WorkoutSession, b: WorkoutSession) => b.createdAt.localeCompare(a.createdAt);
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Análises locais simples a partir do histórico; sempre devolve ao menos um item. */
export const getInsights = (sessions: WorkoutSession[]): Insight[] => {
  const completed = [...completedSessions(sessions)].sort(newestFirst);
  if (completed.length < 2) {
    return [{ title: 'Crie sua linha de base', detail: 'Conclua mais um treino para comparar sua evolução.', icon: 'flag' }];
  }
  const comparable = [...comparableSessions(completed).values()]
    .filter((group) => group.length >= 2)
    .map((group) => [...group].sort(newestFirst))
    .sort((a, b) => newestFirst(a[0], b[0]))[0];
  if (!comparable) {
    return [{ title: 'Compare treinos parecidos', detail: `${completed.length} treinos concluídos usam configurações diferentes.`, icon: 'copy' }];
  }
  const [latest, previous] = comparable;
  const delta = latest.totalReps - previous.totalReps;
  const name = sessionTitle(latest);
  const direction =
    delta === 0 ? 'manteve o resultado' : delta > 0 ? `melhorou em ${plural(delta, 'repetição', 'repetições')}` : `ficou ${plural(-delta, 'repetição abaixo', 'repetições abaixo')}`;
  const insights: Insight[] = [
    {
      title: 'Tendência recente',
      detail: `No ${name}, seu último resultado ${direction} em relação ao treino anterior.`,
      icon: delta === 0 ? 'remove' : delta > 0 ? 'trending-up' : 'trending-down',
    },
    { title: 'Seus dados', detail: `${plural(completed.length, 'treino concluído faz', 'treinos concluídos fazem')} parte destas análises locais.`, icon: 'barbell' },
  ];
  if (completed.length >= 3) {
    const activeDates = new Set(completed.map((session) => session.localDate));
    insights.push({ title: 'Consistência', detail: `${plural(activeDates.size, 'dia de treino aparece', 'dias de treino aparecem')} no seu histórico.`, icon: 'calendar' });
  }
  return insights;
};

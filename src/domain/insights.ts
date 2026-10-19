import { WorkoutSession } from './models';
import { comparableSessions, completedSessions } from './records';

export type Insight = { title: string; detail: string };
export const getInsights = (sessions: WorkoutSession[]): Insight[] => {
  const completed = [...completedSessions(sessions)].sort((a, b) => b.localDate.localeCompare(a.localDate));
  if (completed.length < 2) return [{ title: 'Crie sua linha de base', detail: 'Conclua mais um treino para comparar sua evolução.' }];
  const comparable = [...comparableSessions(completed).values()]
    .filter((group) => group.length >= 2)
    .sort((a, b) => b[b.length - 1].localDate.localeCompare(a[a.length - 1].localDate))[0];
  if (!comparable) return [{ title: 'Compare treinos parecidos', detail: `${completed.length} treinos concluídos usam configurações diferentes.` }];
  const ordered = [...comparable].sort((a, b) => b.localDate.localeCompare(a.localDate));
  const delta = ordered[0].totalReps - ordered[1].totalReps;
  const direction = delta === 0 ? 'manteve o resultado' : delta > 0 ? `melhorou em ${delta} repetições` : `ficou ${Math.abs(delta)} repetições abaixo`;
  const insights: Insight[] = [
    { title: 'Tendência recente', detail: `Seu último resultado comparável ${direction} em relação ao treino anterior.` },
    { title: 'Seus dados', detail: `${completed.length} treinos concluídos fazem parte destas análises locais.` },
  ];
  if (completed.length >= 3) {
    const activeDates = new Set(completed.map((session) => session.localDate));
    insights.push({ title: 'Consistência', detail: `${activeDates.size} dias de treino aparecem no seu histórico.` });
  }
  return insights;
};

/** Texto da meta de rounds: "Meta 15 · atingida ✓" ou "Meta 15 · faltaram 2". */
export const targetSummary = (targetRounds: number | undefined, completedRounds: number) => {
  if (!targetRounds) return undefined;
  const missing = targetRounds - completedRounds;
  const hit = missing <= 0;
  const text = hit ? `Meta ${targetRounds} · atingida ✓` : `Meta ${targetRounds} · ${missing === 1 ? 'faltou' : 'faltaram'} ${missing}`;
  return { hit, text };
};

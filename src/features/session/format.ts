/** "m:ss" a partir de milissegundos. */
export const formatDuration = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Rótulos do RPE (1-10). */
export const RPE_LABELS: Record<number, string> = {
  1: 'Muito leve',
  2: 'Leve',
  3: 'Leve a moderado',
  4: 'Moderado',
  5: 'Moderado a puxado',
  6: 'Puxado',
  7: 'Difícil',
  8: 'Muito difícil',
  9: 'Quase no limite',
  10: 'Máximo',
};

/** Cores verde -> vermelho para o RPE 1-10. */
export const RPE_COLORS = ['#3DDC84', '#6FD96A', '#9ED84F', '#C8D43F', '#F0CC35', '#FFB02E', '#FF8A2A', '#FF6A2F', '#FF4D3D', '#FF2D4D'];

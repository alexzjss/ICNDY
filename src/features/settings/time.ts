const pad = (n: number) => String(n).padStart(2, '0');

/** Converte "HH:MM" em hora/minuto válidos (padrão 18:00). */
export const parseTime = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return { hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 18, minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0 };
};

export const formatTime = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`;

/** Arredonda o minuto para o múltiplo de 5 mais próximo (55+ vira 55). */
export const snapMinute = (minute: number) => Math.min(55, Math.round(minute / 5) * 5);

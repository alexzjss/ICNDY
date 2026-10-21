const pad = (value: number) => String(value).padStart(2, '0');

/** Data no fuso LOCAL em YYYY-MM-DD. */
export const localDateString = (date: Date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parts = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
};

const utcValue = (dateStr: string) => {
  const { year, month, day } = parts(dateStr);
  return Date.UTC(year, month - 1, day);
};

/** Soma dias a uma data YYYY-MM-DD (aritmética de calendário, independente de fuso/DST). */
export const addDays = (dateStr: string, days: number) => {
  const date = new Date(utcValue(dateStr) + Math.round(days) * 86400000);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** Dia da semana (0 = domingo ... 6 = sábado) de uma data YYYY-MM-DD. */
export const weekdayOf = (dateStr: string) => new Date(utcValue(dateStr)).getUTCDay();

/** Diferença em dias (b - a) entre duas datas YYYY-MM-DD. */
export const diffDays = (a: string, b: string) => Math.round((utcValue(b) - utcValue(a)) / 86400000);

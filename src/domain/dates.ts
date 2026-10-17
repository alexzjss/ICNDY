export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (value: string, amount: number) => {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return localDate(date);
};

export const formatLocalDate = (value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  parseLocalDate(value).toLocaleDateString(undefined, options);

import { describe, expect, it } from 'vitest';
import { addDays, diffDays, localDateString, weekdayOf } from '../src/domain/dates';

describe('dates', () => {
  it('formats the LOCAL date, not the UTC one', () => {
    expect(localDateString(new Date(2025, 0, 5, 23, 30))).toBe('2025-01-05');
    expect(localDateString(new Date(2025, 0, 5, 0, 5))).toBe('2025-01-05');
  });
  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2025-01-31', 1)).toBe('2025-02-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
  });
  it('computes weekday and day differences', () => {
    expect(weekdayOf('2025-01-06')).toBe(1); // segunda
    expect(weekdayOf('2025-01-05')).toBe(0); // domingo
    expect(diffDays('2025-01-01', '2025-03-01')).toBe(59);
  });
});

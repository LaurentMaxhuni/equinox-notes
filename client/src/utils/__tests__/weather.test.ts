import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateToPartOfDay, temperatureToMood } from '../weather';

describe('temperatureToMood', () => {
  it('labels warm temperatures at or above 20°C as warm', () => {
    expect(temperatureToMood(20)).toBe('warm');
    expect(temperatureToMood(26.4)).toBe('warm');
  });

  it('labels cooler temperatures as chilly', () => {
    expect(temperatureToMood(19.9)).toBe('chilly');
    expect(temperatureToMood(-2)).toBe('chilly');
  });
});

describe('dateToPartOfDay', () => {
  it('identifies daytime hours correctly', () => {
    const morning = new Date('2024-09-22T08:00:00Z');
    vi.setSystemTime(morning);
    expect(dateToPartOfDay(new Date())).toBe('day');
  });

  it('identifies nighttime hours correctly', () => {
    const night = new Date('2024-09-22T22:00:00Z');
    vi.setSystemTime(night);
    expect(dateToPartOfDay(new Date())).toBe('night');
  });
});


afterEach(() => {
  vi.useRealTimers();
});

import { describe, expect, it } from 'vitest';
import { dateToPartOfDay, temperatureToMood } from '../weather';

describe('weather utilities', () => {
  it('maps temperature to mood', () => {
    expect(temperatureToMood(25)).toBe('warm');
    expect(temperatureToMood(10)).toBe('chilly');
  });

  it('determines part of day from local time', () => {
    expect(dateToPartOfDay(new Date('2024-09-22T10:00:00Z'))).toBeTypeOf('string');
    const morning = new Date();
    morning.setHours(9);
    expect(dateToPartOfDay(morning)).toBe('day');
    const evening = new Date();
    evening.setHours(21);
    expect(dateToPartOfDay(evening)).toBe('night');
  });
});

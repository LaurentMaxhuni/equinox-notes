import type { Mood, PartOfDay } from '../types';

export const temperatureToMood = (tempC: number): Mood => (tempC >= 20 ? 'warm' : 'chilly');

export const dateToPartOfDay = (date: Date): PartOfDay => {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
};

export type WeatherSnapshot = {
  tempC: number;
  mood: Mood;
  partOfDay: PartOfDay;
  resolvedAt: Date;
};

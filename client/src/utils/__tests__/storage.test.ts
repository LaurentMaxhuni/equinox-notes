import { describe, expect, it } from 'vitest';
import { readJsonFromStorage, writeJsonToStorage } from '../storage';

describe('storage utilities', () => {
  it('writes and reads JSON payloads', () => {
    writeJsonToStorage('equinox:test', { value: 42 });
    expect(readJsonFromStorage('equinox:test', null)).toEqual({ value: 42 });
  });

  it('returns the fallback when JSON is invalid', () => {
    window.localStorage.setItem('equinox:bad', 'not-json');
    expect(readJsonFromStorage('equinox:bad', { value: 'fallback' })).toEqual({ value: 'fallback' });
  });
});

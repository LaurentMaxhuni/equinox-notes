import { describe, expect, it } from 'vitest';
import { readJsonFromStorage, writeJsonToStorage } from '../storage';

describe('storage helpers', () => {
  it('reads previously stored JSON', () => {
    writeJsonToStorage('test:key', { hello: 'world' });
    expect(readJsonFromStorage('test:key', { hello: 'fallback' })).toEqual({ hello: 'world' });
  });

  it('returns fallback when JSON is invalid', () => {
    window.localStorage.setItem('broken:key', '{not-valid');
    expect(readJsonFromStorage('broken:key', 42)).toBe(42);
  });
});

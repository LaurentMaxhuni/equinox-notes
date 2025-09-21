
import { describe, expect, it, vi } from 'vitest';
import { randomGuestUsername, slugifyUsername } from '../slug';

describe('slug utilities', () => {
  it('slugifies usernames by trimming, replacing invalid characters, and lowercasing', () => {
    expect(slugifyUsername('  Autumn Breeze ')).toBe('autumn_breeze');
    expect(slugifyUsername('Acorns*&^!')).toBe('acorns____');
    expect(slugifyUsername('a'.repeat(40))).toBe('a'.repeat(24));
  });

  it('generates random guest usernames with a hex suffix', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomGuestUsername()).toBe('guest-7fff');
    vi.restoreAllMocks();
  });
});

import { describe, expect, it } from 'vitest';
import { randomGuestUsername, slugifyUsername } from '../slug';

describe('slug utilities', () => {
  it('sanitizes usernames with unsupported characters', () => {
    expect(slugifyUsername('Autumn Breeze!')).toBe('autumn_breeze_');
    expect(slugifyUsername('  Cozy*Writer  ')).toBe('cozy_writer');
  });

  it('generates guest usernames with hex suffix', () => {
    const username = randomGuestUsername();
    expect(username).toMatch(/^guest-[0-9a-f]{4}$/);
  });
});

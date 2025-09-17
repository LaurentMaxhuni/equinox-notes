const USERNAME_REGEX = /[^A-Za-z0-9_]+/g;

export const slugifyUsername = (value: string) => {
  const sanitized = value.trim().replace(USERNAME_REGEX, '_');
  return sanitized.slice(0, 24).toLowerCase();
};

export const randomGuestUsername = () => {
  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `guest-${suffix}`;
};

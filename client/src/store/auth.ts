import { create } from 'zustand';
import { readJsonFromStorage, writeJsonToStorage } from '../utils/storage';

const AUTH_KEY = 'equinox:auth';

type User = {
  id: string;
  username: string;
};

type StoredAuth = {
  user: User;
  token: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (payload: StoredAuth) => void;
  logout: () => void;
};

const readAuthFromStorage = (): StoredAuth | null => {
  return readJsonFromStorage<StoredAuth | null>(AUTH_KEY, null);
};

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window === 'undefined' ? null : readAuthFromStorage()?.user ?? null,
  token: typeof window === 'undefined' ? null : readAuthFromStorage()?.token ?? null,
  hydrated: typeof window === 'undefined',
  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ hydrated: true });
      return;
    }

    const stored = readAuthFromStorage();
    if (!stored) {
      set({ user: null, token: null, hydrated: true });
      return;
    }

    try {
      const response = await fetch('/auth/me', {
        headers: { Authorization: `Bearer ${stored.token}` },
      });

      if (!response.ok) {
        window.localStorage.removeItem(AUTH_KEY);
        set({ user: null, token: null, hydrated: true });
        return;
      }

      const data = (await response.json()) as { user: User };
      writeJsonToStorage(AUTH_KEY, { user: data.user, token: stored.token });
      set({ user: data.user, token: stored.token, hydrated: true });
    } catch (error) {
      console.warn('Failed to hydrate auth', error);
      window.localStorage.removeItem(AUTH_KEY);
      set({ user: null, token: null, hydrated: true });
    }
  },
  login: ({ user, token }) => {
    writeJsonToStorage(AUTH_KEY, { user, token });
    set({ user, token, hydrated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_KEY);
    }
    set({ user: null, token: null, hydrated: true });
  },
}));

export type { StoredAuth, User };

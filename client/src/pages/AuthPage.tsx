import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useAuthStore, type StoredAuth } from '../store/auth';
import { randomGuestUsername } from '../utils/slug';
import type { Mood, PartOfDay } from '../types';

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
});

type Mode = 'login' | 'register';

type FormErrors = Partial<Record<'username' | 'password', string>>;

type AuthPageProps = {
  onMoodChange: (mood: Mood) => void;
  onPartOfDayChange: (part: PartOfDay) => void;
};

export function AuthPage({ onMoodChange, onPartOfDayChange }: AuthPageProps) {
  const login = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const heading = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your Equinox identity'), [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setErrors({});
    setServerError(null);
  };

  const mapError = (error: z.ZodError) => {
    const fieldErrors: FormErrors = {};
    error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field === 'username' || field === 'password') {
        fieldErrors[field] = issue.message;
      }
    });
    return fieldErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const result = credentialsSchema.safeParse(form);
    if (!result.success) {
      setErrors(mapError(result.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch(`/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
        if (payload && typeof payload.error === 'object' && payload.error) {
          const errorMap = payload.error as Record<string, unknown>;
          const fieldErrors: FormErrors = {};
          const usernameMessages = Array.isArray(errorMap.username) ? errorMap.username : null;
          if (usernameMessages && usernameMessages.length > 0) {
            fieldErrors.username = String(usernameMessages[0]);
          }
          const passwordMessages = Array.isArray(errorMap.password) ? errorMap.password : null;
          if (passwordMessages && passwordMessages.length > 0) {
            fieldErrors.password = String(passwordMessages[0]);
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
          }
        }
        setServerError('Unable to authenticate with those credentials.');
        return;
      }

      const data = (await response.json()) as StoredAuth;
      login(data);
      onMoodChange('warm');
      onPartOfDayChange('day');
    } catch (error) {
      console.warn('Auth request failed', error);
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoUser = () => {
    const username = randomGuestUsername();
    setForm({ username, password: 'guest-pass' });
    setMode('register');
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="glass-card w-full max-w-md px-6 py-8 text-left shadow-2xl">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Equinox Notes</p>
      <h1 className="mt-2 font-display text-3xl text-amber-100">{heading}</h1>
      <p className="mt-2 text-sm text-stone-300">
        Local-first notes, weather-aware moods, and a cozy canvas for September thoughts.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-200" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className="surface-input"
            placeholder="autumn_writer"
          />
          {errors.username && <p className="text-sm text-rose-300">{errors.username}</p>}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="surface-input"
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="text-sm text-rose-300">{errors.password}</p>}
        </div>

        {serverError && <p className="text-sm text-rose-300">{serverError}</p>}

        <button type="submit" className="surface-button w-full" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm text-stone-300">
        <button type="button" onClick={toggleMode} className="text-amber-200 underline-offset-4 hover:underline">
          {mode === 'login' ? 'Need an account? Register instead.' : 'Already have an account? Log in.'}
        </button>
        <button type="button" onClick={handleDemoUser} className="surface-button secondary w-full justify-center">
          Try a demo user
        </button>
      </div>
    </div>
  );
}

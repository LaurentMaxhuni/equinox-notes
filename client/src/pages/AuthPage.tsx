import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import type { StoredAuth } from '../store/auth';
import { randomGuestUsername, slugifyUsername } from '../utils/slug';
import type { Mood, PartOfDay } from '../types';

type AuthPageProps = {
  onMoodChange: (mood: Mood) => void;
  onPartOfDayChange: (part: PartOfDay) => void;
};

type Mode = 'login' | 'register';

type FormState = {
  username: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const usernameRegex = /^[A-Za-z0-9_]+$/;

const validateCredentials = ({ username, password }: FormState): FormErrors => {
  const errors: FormErrors = {};
  const trimmed = username.trim();

  if (!trimmed) {
    errors.username = 'Username is required';
  } else if (trimmed.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (trimmed.length > 24) {
    errors.username = 'Username must be at most 24 characters';
  } else if (!usernameRegex.test(trimmed)) {
    errors.username = 'Only letters, numbers, and underscores allowed';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password.length > 72) {
    errors.password = 'Password must be at most 72 characters';
  }

  return errors;
};

export function AuthPage({ onMoodChange, onPartOfDayChange }: AuthPageProps) {
  const login = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<FormState>({ username: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const sanitizedUsername = slugifyUsername(form.username);
    const nextForm = { username: sanitizedUsername, password: form.password };
    const validationErrors = validateCredentials(nextForm);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
        if (payload && typeof payload.error === 'object' && payload.error) {
          const fieldErrors: FormErrors = {};
          const errorMap = payload.error as Record<string, unknown>;
          const usernameIssues = Array.isArray(errorMap.username) ? errorMap.username : null;
          if (usernameIssues && usernameIssues.length > 0) {
            fieldErrors.username = String(usernameIssues[0]);
          }
          const passwordIssues = Array.isArray(errorMap.password) ? errorMap.password : null;
          if (passwordIssues && passwordIssues.length > 0) {
            fieldErrors.password = String(passwordIssues[0]);
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
          }
        }
        setServerError(typeof payload?.error === 'string' ? payload.error : 'Unable to authenticate');
        return;
      }

      const data = (await response.json()) as StoredAuth;
      login(data);
      setForm({ username: nextForm.username, password: '' });
      onMoodChange('warm');
      onPartOfDayChange('day');
    } catch (error) {
      console.warn(error);
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = () => {
    const username = randomGuestUsername();
    setForm({ username, password: 'guest-pass' });
    setMode('register');
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="brand-title">Equinox Notes</h1>
        <p className="brand-subtitle">A cozy, local-first notes app for the season of balance.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="input"
              placeholder="autumn_writer"
            />
            {errors.username && <p className="form-error">{errors.username}</p>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="input"
              placeholder="at least 8 characters"
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {serverError && <p className="form-error">{serverError}</p>}

          <button type="submit" disabled={isSubmitting} className="button button-primary">
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        <div className="auth-actions">
          <button type="button" onClick={toggleMode} className="link-button">
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
          </button>
          <button type="button" onClick={handleDemo} className="button button-ghost button-compact">
            Try a demo user
          </button>
        </div>
      </div>
    </div>
  );
}

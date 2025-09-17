import { FormEvent, useState } from "react";
import { z } from "zod";
import { useAuthStore } from "../store/auth";
import { randomGuestUsername, slugifyUsername } from "../utils/slug";
import type { Mood, PartOfDay } from "../types";

const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

type AuthPageProps = {
  onMoodChange: (mood: Mood) => void;
  onPartOfDayChange: (part: PartOfDay) => void;
};

type Mode = "login" | "register";

type FormErrors = Partial<Record<keyof z.infer<typeof credentialsSchema>, string>>;

export function AuthPage({ onMoodChange, onPartOfDayChange }: AuthPageProps) {
  const login = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const sanitizedUsername = slugifyUsername(form.username);
    const parsed = credentialsSchema.safeParse({
      username: sanitizedUsername,
      password: form.password,
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field as keyof FormErrors]) {
          fieldErrors[field as keyof FormErrors] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setForm((prev) => ({ ...prev, username: sanitizedUsername }));
    setIsSubmitting(true);
    try {
      const response = await fetch(`/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setServerError(typeof payload.error === "string" ? payload.error : "Unable to authenticate");
        return;
      }

      const data = await response.json();
      login(data);
      onMoodChange("warm");
      onPartOfDayChange("day");
    } catch (error) {
      console.warn(error);
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = () => {
    const username = randomGuestUsername();
    setForm({ username, password: "guest-pass" });
    setMode("register");
    setErrors({});
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 px-4 py-12 text-stone-100">
      <div className="w-full max-w-md rounded-3xl bg-stone-900/70 p-8 shadow-xl ring-1 ring-stone-700/70">
        <h1 className="text-center font-display text-3xl font-semibold text-amber-200">Equinox Notes</h1>
        <p className="mt-2 text-center text-sm text-stone-400">A cozy, local-first notes app for the season of balance.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-200" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full rounded-xl border border-stone-700/60 bg-stone-950/70 px-4 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              placeholder="autumn_writer"
            />
            {errors.username && <p className="text-xs text-red-300">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-stone-700/60 bg-stone-950/70 px-4 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              placeholder="at least 8 characters"
            />
            {errors.password && <p className="text-xs text-red-300">{errors.password}</p>}
          </div>

          {serverError && <p className="text-sm text-red-300">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 shadow transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-stone-400">
          <button
            type="button"
            onClick={toggleMode}
            className="text-amber-200 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/60"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
          </button>
          <button
            type="button"
            onClick={handleDemo}
            className="rounded-full border border-stone-700/60 px-4 py-2 text-xs uppercase tracking-wide text-stone-300 hover:border-amber-300 hover:text-amber-200"
          >
            Try a demo user
          </button>
        </div>
      </div>
    </div>
  );
}

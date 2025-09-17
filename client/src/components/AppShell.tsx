import { useMemo } from 'react';
import { clsx } from 'clsx';
import Notes from './Notes';
import Weather from './Weather';
import { useAuthStore } from '../store/auth';
import type { Mood, PartOfDay } from '../types';

type AppShellProps = {
  mood: Mood;
  partOfDay: PartOfDay;
  onMoodChange: (mood: Mood) => void;
  onPartOfDayChange: (part: PartOfDay) => void;
};

const moodCopy: Record<Mood, string> = {
  warm: 'Sun-kissed and ready to write',
  chilly: 'Sweater weather scribbles await',
};

export default function AppShell({ mood, partOfDay, onMoodChange, onPartOfDayChange }: AppShellProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const greeting = useMemo(() => {
    const base = partOfDay === 'day' ? 'Good day' : 'Good evening';
    return `${base}, ${user?.username ?? 'friend'}`;
  }, [partOfDay, user?.username]);

  if (!user) {
    return null;
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-8 sm:px-8">
      <header className="flex flex-col gap-4 rounded-2xl bg-stone-900/60 p-6 ring-1 ring-stone-700/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-stone-400">{greeting}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-amber-100 sm:text-4xl">Equinox Notes</h1>
          <p className="mt-2 text-sm text-stone-300/90">{moodCopy[mood]}</p>
        </div>
        <div className="flex items-center gap-4">
          <Weather onMoodChange={onMoodChange} onPartOfDayChange={onPartOfDayChange} mood={mood} />
          <button
            type="button"
            onClick={logout}
            className={clsx(
              'rounded-full border border-stone-700/60 bg-stone-900/50 px-4 py-2 text-sm font-medium text-stone-200 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70',
              'hover:bg-stone-800/70'
            )}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Notes userId={user.id} />
      </main>
    </div>
  );
}

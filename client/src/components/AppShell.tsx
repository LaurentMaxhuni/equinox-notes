import { useMemo } from 'react';
import type { Mood, PartOfDay } from '../types';
import Notes from './Notes';
import Weather from './Weather';
import { useAuthStore } from '../store/auth';

type AppShellProps = {
  mood: Mood;
  partOfDay: PartOfDay;
  onMoodChange: (mood: Mood) => void;
  onPartOfDayChange: (part: PartOfDay) => void;
};

const moodCopy: Record<Mood, string> = {
  warm: 'Sun-kissed pages and amber reflections await.',
  chilly: 'Sweater weather scribbles to warm the soul.',
};

export default function AppShell({ mood, partOfDay, onMoodChange, onPartOfDayChange }: AppShellProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const greeting = useMemo(() => {
    const salutation = partOfDay === 'day' ? 'Good day' : 'Good evening';
    return `${salutation}, ${user?.username ?? 'friend'}`;
  }, [partOfDay, user?.username]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="glass-card flex flex-col gap-6 px-6 py-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">{greeting}</p>
          <h1 className="font-display text-4xl text-amber-100 sm:text-5xl">Equinox Notes</h1>
          <p className="text-sm text-stone-300">{moodCopy[mood]}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Weather mood={mood} onMoodChange={onMoodChange} onPartOfDayChange={onPartOfDayChange} />
          <button type="button" onClick={logout} className="surface-button secondary">
            Log out
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Notes userId={user.id} />
      </main>
    </div>
  );
}

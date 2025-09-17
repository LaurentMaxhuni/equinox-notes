import { useMemo } from 'react';
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
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-text">
          <p className="app-greeting">{greeting}</p>
          <h1 className="app-title">Equinox Notes</h1>
          <p className="app-subtitle">{moodCopy[mood]}</p>
        </div>
        <div className="app-header-controls">
          <Weather onMoodChange={onMoodChange} onPartOfDayChange={onPartOfDayChange} mood={mood} />
          <button type="button" onClick={logout} className="button button-ghost">
            Log out
          </button>
        </div>
      </header>

      <main className="app-main">
        <Notes userId={user.id} />
      </main>
    </div>
  );
}

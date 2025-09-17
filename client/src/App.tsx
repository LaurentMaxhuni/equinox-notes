import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import FallingLeaves from './components/FallingLeaves';
import { AuthPage } from './pages/AuthPage';
import { useAuthStore } from './store/auth';
import type { Mood, PartOfDay } from './types';

const BODY_THEME_KEY = 'theme';
const BODY_PART_KEY = 'partOfDay';

export default function App() {
  const { user, hydrated, hydrate } = useAuthStore((state) => ({
    user: state.user,
    hydrated: state.hydrated,
    hydrate: state.hydrate,
  }));
  const [mood, setMood] = useState<Mood>('chilly');
  const [partOfDay, setPartOfDay] = useState<PartOfDay>('day');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.body.dataset[BODY_THEME_KEY] = mood;
    return () => {
      delete document.body.dataset[BODY_THEME_KEY];
    };
  }, [mood]);

  useEffect(() => {
    document.body.dataset[BODY_PART_KEY] = partOfDay;
    return () => {
      delete document.body.dataset[BODY_PART_KEY];
    };
  }, [partOfDay]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/30">
        <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Brewing autumn magic…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <FallingLeaves mood={mood} />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <AuthPage onMoodChange={setMood} onPartOfDayChange={setPartOfDay} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FallingLeaves mood={mood} />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <AppShell mood={mood} partOfDay={partOfDay} onMoodChange={setMood} onPartOfDayChange={setPartOfDay} />
      </div>
    </div>
  );
}

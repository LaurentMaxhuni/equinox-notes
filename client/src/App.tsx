import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import FallingLeaves from './components/FallingLeaves';
import { AuthPage } from './pages/AuthPage';
import { useAuthStore } from './store/auth';
import type { Mood, PartOfDay } from './types';

const BODY_THEME_KEY = 'theme';
const BODY_PART_KEY = 'partOfDay';

type Mood = 'warm' | 'chilly';
type PartOfDay = 'day' | 'night';

const BODY_CLASSES: Record<Mood, string> = {
  warm: 'warm-gradient',
  chilly: 'chilly-gradient',
};

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
    const classes = document.body.classList;
    classes.remove(...Object.values(BODY_CLASSES));
    classes.add(BODY_CLASSES[mood]);
    return () => {
      classes.remove(...Object.values(BODY_CLASSES));
    };
  }, [mood]);

  useEffect(() => {
    document.body.dataset[BODY_PART_KEY] = partOfDay;
    return () => {
      delete document.body.dataset[BODY_PART_KEY];
    document.body.dataset.partOfDay = partOfDay;
    return () => {
      delete document.body.dataset.partOfDay;
    };
  }, [partOfDay]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/30">
        <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Brewing autumn magic…</p>
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">
        <span className="animate-pulse tracking-wide uppercase text-sm">Brewing autumn magic…</span>
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
    return <AuthPage onMoodChange={setMood} onPartOfDayChange={setPartOfDay} />;
  }

  return (
    <div className="relative min-h-screen text-stone-100">
      <FallingLeaves mood={mood} />
      <div className="relative z-10 backdrop-blur-sm min-h-screen bg-gradient-to-b from-stone-950/40 via-stone-950/30 to-stone-950/50">
        <AppShell
          mood={mood}
          partOfDay={partOfDay}
          onMoodChange={setMood}
          onPartOfDayChange={setPartOfDay}
        />
      </div>
    </div>
  );
}

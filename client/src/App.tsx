import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import FallingLeaves from './components/FallingLeaves';
import { AuthPage } from './pages/AuthPage';
import { useAuthStore } from './store/auth';

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
    const classes = document.body.classList;
    classes.remove(...Object.values(BODY_CLASSES));
    classes.add(BODY_CLASSES[mood]);
    return () => {
      classes.remove(...Object.values(BODY_CLASSES));
    };
  }, [mood]);

  useEffect(() => {
    document.body.dataset.partOfDay = partOfDay;
    return () => {
      delete document.body.dataset.partOfDay;
    };
  }, [partOfDay]);

  if (!hydrated) {
    return (
      <div className="loading-screen">
        <span className="loading-message">Brewing autumn magic…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onMoodChange={setMood} onPartOfDayChange={setPartOfDay} />;
  }

  return (
    <div className="app-root">
      <FallingLeaves mood={mood} />
      <div className="app-surface">
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

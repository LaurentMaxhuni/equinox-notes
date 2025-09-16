import { useEffect, useState } from 'react';

type WeatherState = {
  tempC: number | null;
  unit: 'C' | 'F';
  mood: 'warm' | 'chilly' | 'neutral';
  isDay: boolean;
};

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export default function Weather({ onMood }: { onMood?: (s: WeatherState) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WeatherState>({ tempC: null, unit: 'C', mood: 'neutral', isDay: true });

  useEffect(() => {
    let mounted = true;
    async function run(lat?: number, lon?: number) {
      try {
        setLoading(true);
        const now = new Date();
        // If geolocation is available, prefer that
        let url = `${OPEN_METEO_BASE}?current_weather=true&temperature_unit=celsius`;
        if (typeof lat === 'number' && typeof lon === 'number') {
          url += `&latitude=${lat}&longitude=${lon}`;
        } else {
          // fallback: fetch a default location (e.g., Greenwich)
          url += `&latitude=51.48&longitude=-0.0015`;
        }

        const res = await fetch(url);
        const data = await res.json();
        const t = data?.current_weather?.temperature ?? null;
        const isDay = now.getHours() >= 6 && now.getHours() < 20;
        let mood: WeatherState['mood'] = 'neutral';
        if (t !== null) mood = t >= 18 ? 'warm' : (t <= 12 ? 'chilly' : 'neutral');

        const next: WeatherState = { tempC: t, unit: 'C', mood, isDay };
        if (!mounted) return;
        setState(next);
        onMood?.(next);
        setLoading(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setLoading(false);
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => run(pos.coords.latitude, pos.coords.longitude),
        err => { console.warn('Geolocation failed, using fallback', err); run(); },
        { timeout: 5000 }
      );
    } else {
      run();
    }

    return () => { mounted = false; };
  }, [onMood]);

  if (loading) return <div className="p-3 rounded-lg bg-white/40 backdrop-blur-sm">Loading weather…</div>;
  if (error) return <div className="p-3 rounded-lg bg-white/40 backdrop-blur-sm text-red-600">{error}</div>;

  return (
    <div className="p-3 rounded-lg bg-white/40 backdrop-blur-sm w-48 text-right">
      <div className="text-sm text-slate-700">{state.isDay ? 'Day' : 'Night'}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{state.tempC != null ? `${Math.round(state.tempC)}°C` : '—'}</div>
      <div className="text-xs text-slate-700/80 mt-1">Mood: <span className="capitalize">{state.mood}</span></div>
    </div>
  );
}

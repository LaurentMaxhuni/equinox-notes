import { useEffect, useMemo, useState } from "react";
import type { Mood, PartOfDay } from "../types";
import { dateToPartOfDay, temperatureToMood, type WeatherSnapshot } from "../utils/weather";

type WeatherProps = {
  mood: Mood;
  onMoodChange?: (mood: Mood) => void;
  onPartOfDayChange?: (part: PartOfDay) => void;
};

type WeatherState = {
  loading: boolean;
  error: string | null;
  snapshot: WeatherSnapshot | null;
  label: string;
};

const FALLBACK_COORDS = { latitude: 42.66, longitude: 21.17, label: "Pristina, XK" } as const;

export default function Weather({ mood, onMoodChange, onPartOfDayChange }: WeatherProps) {
  const [state, setState] = useState<WeatherState>({
    loading: true,
    error: null,
    snapshot: null,
    label: "Loading…",
  });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const resolveWeather = async (latitude: number, longitude: number, label: string) => {
      try {
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          current_weather: "true",
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        const data = await response.json();
        const tempC = Number(data?.current_weather?.temperature ?? data?.current_weather?.temperature_2m ?? 0);
        const part = dateToPartOfDay(new Date());
        const moodValue = temperatureToMood(tempC);
        const snapshot: WeatherSnapshot = {
          tempC,
          mood: moodValue,
          partOfDay: part,
          resolvedAt: new Date(),
        };

        if (!active) return;

        onMoodChange?.(moodValue);
        onPartOfDayChange?.(part);
        setState({ loading: false, error: null, snapshot, label });
      } catch (error) {
        if (!active) return;
        console.warn(error);
        setState({ loading: false, error: "Weather unavailable", snapshot: null, label });
      }
    };

    const requestWeather = () => {
      if (!('geolocation' in navigator)) {
        resolveWeather(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, FALLBACK_COORDS.label).catch(() => undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolveWeather(position.coords.latitude, position.coords.longitude, "Your sky").catch(() => undefined);
        },
        () => {
          resolveWeather(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, FALLBACK_COORDS.label).catch(() => undefined);
        },
        { enableHighAccuracy: false, timeout: 5000 },
      );
    };

    requestWeather();

    return () => {
      active = false;
      controller.abort();
    };
  }, [onMoodChange, onPartOfDayChange]);

  const badgeClasses = useMemo(
    () =>
      mood === "warm"
        ? "bg-amber-400/20 text-amber-200 border border-amber-300/40"
        : "bg-slate-500/20 text-slate-200 border border-slate-300/30",
    [mood],
  );

  return (
    <section
      className="flex min-w-[180px] items-center gap-3 rounded-2xl bg-stone-950/60 px-4 py-3 text-sm text-stone-200 ring-1 ring-stone-700/60"
      aria-live="polite"
    >
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-stone-500">{state.label}</span>
        {state.loading && <span className="text-lg font-semibold text-stone-200">Fetching…</span>}
        {!state.loading && state.error && <span className="text-lg font-semibold text-stone-200">{state.error}</span>}
        {!state.loading && state.snapshot && (
          <span className="text-lg font-semibold text-stone-100">{Math.round(state.snapshot.tempC)}°C</span>
        )}
      </div>
      <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs ${badgeClasses}`}>
        {state.snapshot ? (
          <>
            <span className="font-semibold uppercase tracking-wide">{state.snapshot.mood}</span>
            <span className="text-[11px] tracking-wide text-stone-200/80">{state.snapshot.partOfDay}</span>
          </>
        ) : (
          <span className="text-[11px] tracking-wide text-stone-200/80">Awaiting sky data…</span>
        )}
      </div>
    </section>
  );
}

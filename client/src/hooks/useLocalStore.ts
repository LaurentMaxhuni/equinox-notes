import { useEffect, useRef, useState } from 'react';
import { readJsonFromStorage } from '../utils/storage';

type InitialValue<T> = T | (() => T);

const resolveInitial = <T,>(value: InitialValue<T>): T => (typeof value === 'function' ? (value as () => T)() : value);

export function useLocalStore<T>(key: string, initial: InitialValue<T>) {
  const [state, setState] = useState<T>(() => {
    const fallback = resolveInitial(initial);
    return readJsonFromStorage(key, fallback);
  });

  const previousKey = useRef(key);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      setState(readJsonFromStorage(key, resolveInitial(initial)));
    }
  }, [initial, key]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (typeof debounceRef.current === 'number') {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn('Unable to persist local store', error);
      }
    }, 200);

    return () => {
      if (typeof debounceRef.current === 'number') {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [key, state]);

  return [state, setState] as const;
}

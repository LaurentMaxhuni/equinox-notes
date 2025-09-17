import { useSyncExternalStore } from 'react';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type Selector<T, U> = (state: T) => U;

type StoreHook<T> = {
  (): T;
  <U>(selector: Selector<T, U>): U;
  getState: GetState<T>;
  setState: SetState<T>;
};

type Listener = () => void;

export const createStore = <T>(initializer: (set: SetState<T>, get: GetState<T>) => T): StoreHook<T> => {
  const listeners = new Set<Listener>();

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  let state = {} as T;

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextPartial = typeof partial === 'function' ? (partial as (state: T) => Partial<T>)(state) : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach((listener) => listener());
  };

  state = initializer(setState, getState);

  const useStore = (<U>(selector?: Selector<T, U>) => {
    const slice = selector ?? ((current: T) => current as unknown as U);
    return useSyncExternalStore(subscribe, () => slice(state));
  }) as StoreHook<T>;

  useStore.getState = getState;
  useStore.setState = setState;

  return useStore;
};

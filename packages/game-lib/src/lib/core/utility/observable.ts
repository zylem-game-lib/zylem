import { proxy, subscribe } from 'valtio/vanilla';

type Observer<T> = (value: T) => void;

export function createValtioObservable<T extends object>(initial: T) {
  const state = proxy(initial);

  const listeners = new Set<Observer<T>>();

  const unsubValtio = subscribe(state, () => {
    for (const listener of listeners) {
      listener(state);
    }
  });

  return {
    state,
    subscribe(listener: Observer<T>) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          unsubValtio();
        }
      };
    },
  };
}
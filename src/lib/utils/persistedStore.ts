import { writable, type Writable } from 'svelte/store';

export function persistedString(key: string, defaultValue: string): Writable<string> {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const store = writable<string>(saved ?? defaultValue);
  store.subscribe((v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, v);
  });
  return store;
}

export function persistedBoolean(key: string, defaultValue: boolean): Writable<boolean> {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const store = writable<boolean>(saved !== null ? saved === 'true' : defaultValue);
  store.subscribe((v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, String(v));
  });
  return store;
}

export function persistedNumber(key: string, defaultValue: number): Writable<number> {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const store = writable<number>(saved !== null ? parseInt(saved) : defaultValue);
  store.subscribe((v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, String(v));
  });
  return store;
}

export function persistedJson<T>(key: string, defaultValue: T): Writable<T> {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const store = writable<T>(saved !== null ? JSON.parse(saved) : defaultValue);
  store.subscribe((v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(v));
  });
  return store;
}

import { useSyncExternalStore } from 'react';

// localStorage (xususiy rejimda ham yiqilmaydi)
export const ls = {
  get(k, d) { try { const v = localStorage.getItem('mx_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('mx_' + k, JSON.stringify(v)); } catch { /* joy yo'q */ } },
};

// Kichik global store: React tashqarisidan ham o'qish/yozish mumkin
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      subs.forEach(f => f());
    },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
}

// selector barqaror qiymat qaytarishi kerak (primitiv yoki state bo'lagi)
export function useStore(store, selector = s => s) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

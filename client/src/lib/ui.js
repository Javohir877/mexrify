import { createStore } from './store.js';

export const ui = createStore({ toast: null, menu: null, queueOpen: false, fullOpen: false });

let toastTimer;
export function toast(msg) {
  ui.set({ toast: { msg, k: Date.now() } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.set({ toast: null }), 2400);
}

// menu: { track, x, y, playlistId?, queueIndex? }
export const openMenu = menu => ui.set({ menu });
export const closeMenu = () => ui.get().menu && ui.set({ menu: null });
export const toggleQueue = () => ui.set(s => ({ queueOpen: !s.queueOpen }));
export const setFull = on => ui.set({ fullOpen: on });

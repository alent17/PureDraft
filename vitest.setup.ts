import { vi } from 'vitest';

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (fn: FrameRequestCallback): number => {
    return setTimeout(() => fn(Date.now()), 16) as unknown as number;
  };
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = {
    now: () => Date.now(),
  } as Performance;
}

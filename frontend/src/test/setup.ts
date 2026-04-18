import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Fix for window.requestIdleCallback in tests
if (!window.requestIdleCallback) {
  (window as unknown as { requestIdleCallback: (cb: Function) => void }).requestIdleCallback = (cb: Function) => setTimeout(cb, 1);
}

// Mocking SessionStorage
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: storageMock });

beforeEach(() => {
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

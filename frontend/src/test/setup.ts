import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Fix for window.requestIdleCallback in tests
if (!window.requestIdleCallback) {
  (window as unknown as { requestIdleCallback: (cb: Function) => void }).requestIdleCallback = (cb: Function) => setTimeout(cb, 1);
}

// Mocking Storage
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

const sessionStorageMock = createStorageMock();
const localStorageMock = createStorageMock();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.clearAllMocks();
});

import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { within, fireEvent, screen } from '@testing-library/react';

// Make testing-library utilities available in tests
Object.assign(globalThis, { within, fireEvent, screen });

// Mock fetch to prevent network requests during tests
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    })
  ) as unknown as typeof fetch;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Don't enforce assertions for component rendering tests
  // expect.hasAssertions();
});

// Mock window.matchMedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      media: '',
      onchange: null,
    };
  };

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private callback: IntersectionObserverCallback) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

window.ResizeObserver = MockResizeObserver;

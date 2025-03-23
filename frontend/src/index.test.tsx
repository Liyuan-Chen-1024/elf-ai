import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';

// Mock react-dom/client
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

// Mock App component
vi.mock('./App', () => ({
  default: () => null,
}));

describe('index.tsx', () => {
  let originalConsoleError: typeof console.error;
  let mockRoot: HTMLElement;

  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;
    console.error = vi.fn();

    // Create mock root element
    mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);

    // Clear module cache
    vi.resetModules();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;

    // Clean up DOM
    document.body.innerHTML = '';

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should create root and render app', async () => {
    // Import index to trigger the code
    await import('./index');

    // Verify createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(mockRoot);
  });

  it('should throw error if root element is not found', async () => {
    // Remove root element
    document.body.innerHTML = '';

    // Import index and expect error
    let error: Error | undefined;
    try {
      await import('./index');
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).toBe('Failed to find root element');
  });
});

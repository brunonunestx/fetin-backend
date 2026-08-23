import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockServer } from '@/test/mock-server';

beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  mockServer.resetHandlers();
  cleanup();
  window.localStorage.clear();
});

afterAll(() => {
  mockServer.close();
});

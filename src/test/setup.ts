import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client for tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

// Mock date utilities for consistent testing
vi.mock('@/lib/dateUtils', async () => {
  const actual = await vi.importActual('@/lib/dateUtils');
  return {
    ...actual,
    getTodayString: vi.fn(() => '2024-01-15'),
  };
});

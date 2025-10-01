import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/ThemeProvider';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockBookmark = (overrides = {}) => ({
  id: 1,
  title: 'Test Bookmark',
  url: 'https://example.com',
  description: 'A test bookmark',
  username: 'testuser',
  password: 'testpass',
  category_id: 1,
  is_private: false,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  category: {
    id: 1,
    name: 'Test Category',
    color: '#3B82F6',
    emoji: '📚',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  ...overrides,
});

export const createMockCategory = (overrides = {}) => ({
  id: 1,
  name: 'Test Category',
  color: '#3B82F6',
  emoji: '📚',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Mock API responses
export const mockBookmarksResponse = {
  bookmarks: [createMockBookmark()],
  total: 1,
  page: 1,
  totalPages: 1,
};

export const mockCategoriesResponse = [createMockCategory()];

// Test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockFetchResponse = (data: unknown, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
};

export * from '@testing-library/react';
export { customRender as render };
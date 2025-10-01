// Mock Request and Response for Next.js API routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.Request = jest.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.Response = jest.fn() as any;

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    ...init,
    json: jest.fn().mockResolvedValue(init?.body ? JSON.parse(init.body) : {}),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

import { NextRequest } from 'next/server';

// Mock data generators
const createMockCategory = (overrides = {}) => ({
  id: 1,
  name: 'Test Category',
  color: '#3B82F6',
  emoji: '📚',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Mock the database functions
jest.mock('@/lib/database', () => ({
  getAllCategories: jest.fn(),
  createCategory: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock the auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock the SSE broadcast
jest.mock('../../events/route', () => ({
  broadcastEvent: jest.fn(),
}));

import { getAllCategories, createCategory } from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { broadcastEvent } from '../../events/route';
import { GET, POST } from '../route';

const mockGetAllCategories = getAllCategories as jest.MockedFunction<typeof getAllCategories>;
const mockCreateCategory = createCategory as jest.MockedFunction<typeof createCategory>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockBroadcastEvent = broadcastEvent as jest.MockedFunction<typeof broadcastEvent>;

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('returns all categories', async () => {
      const mockCategories = [createMockCategory()];
      mockGetAllCategories.mockReturnValue(mockCategories);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategories);
      expect(mockGetAllCategories).toHaveBeenCalledWith();
    });

    it('returns 500 on database error', async () => {
      mockGetAllCategories.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch categories');
    });
  });

  describe('POST /api/categories', () => {
    it('creates category for authenticated admin', async () => {
      const categoryData = {
        name: 'New Category',
        color: '#10B981',
        emoji: '🎯',
      };
      const createdCategory = createMockCategory(categoryData);

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockCreateCategory.mockReturnValue(createdCategory);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdCategory);
      expect(mockCreateCategory).toHaveBeenCalledWith(categoryData);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('category_created', createdCategory);
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: '#000000' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('returns 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: '#000000' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 500 on database error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockCreateCategory.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: '#000000' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create category');
    });
  });
});
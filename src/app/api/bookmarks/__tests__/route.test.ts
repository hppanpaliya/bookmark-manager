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
const createMockBookmark = (overrides = {}) => ({
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

// Mock the database functions
jest.mock('@/lib/database', () => ({
  getAllBookmarks: jest.fn(),
  createBookmark: jest.fn(),
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

import { getAllBookmarks, createBookmark } from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { broadcastEvent } from '../../events/route';
import { GET, POST } from '../route';

const mockGetAllBookmarks = getAllBookmarks as jest.MockedFunction<typeof getAllBookmarks>;
const mockCreateBookmark = createBookmark as jest.MockedFunction<typeof createBookmark>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockBroadcastEvent = broadcastEvent as jest.MockedFunction<typeof broadcastEvent>;

describe('/api/bookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bookmarks', () => {
    it('returns bookmarks for authenticated admin user', async () => {
      const mockBookmarks = [createMockBookmark()];
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: mockBookmarks,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        bookmarks: mockBookmarks,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        {
          query: undefined,
          category_id: undefined,
          is_private: undefined,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        { page: 1, limit: 50 },
        true // includePrivate = true for admin
      );
    });

    it('returns public bookmarks for non-admin users', async () => {
      const mockBookmarks = [createMockBookmark({ is_private: false })];
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: mockBookmarks,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        {
          query: undefined,
          category_id: undefined,
          is_private: undefined,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        { page: 1, limit: 50 },
        false // includePrivate = false for non-admin
      );
    });

    it('returns public bookmarks when not authenticated', async () => {
      const mockBookmarks = [createMockBookmark({ is_private: false })];
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: mockBookmarks,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        {
          query: undefined,
          category_id: undefined,
          is_private: undefined,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
        { page: 1, limit: 50 },
        false
      );
    });

    it('handles search query parameter', async () => {
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks?query=test');
      await GET(request);

      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'test' }),
        expect.any(Object),
        false
      );
    });

    it('handles category filter parameter', async () => {
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks?category_id=1');
      await GET(request);

      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 1 }),
        expect.any(Object),
        false
      );
    });

    it('handles sorting parameters', async () => {
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks?sort_by=title&sort_order=asc');
      await GET(request);

      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: 'title',
          sort_order: 'asc',
        }),
        expect.any(Object),
        false
      );
    });

    it('handles pagination parameters', async () => {
      mockGetAllBookmarks.mockReturnValue({
        bookmarks: [],
        total: 0,
        page: 2,
        totalPages: 1,
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks?page=2&limit=10');
      await GET(request);

      expect(mockGetAllBookmarks).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 2, limit: 10 },
        false
      );
    });

    it('returns 500 on database error', async () => {
      mockGetAllBookmarks.mockImplementation(() => {
        throw new Error('Database error');
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch bookmarks');
    });
  });

  describe('POST /api/bookmarks', () => {
    it('creates bookmark for authenticated admin', async () => {
      const bookmarkData = {
        title: 'New Bookmark',
        url: 'https://example.com',
        description: 'A test bookmark',
      };
      const createdBookmark = createMockBookmark(bookmarkData);

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockCreateBookmark.mockReturnValue(createdBookmark);

      const request = new NextRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(bookmarkData),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdBookmark);
      expect(mockCreateBookmark).toHaveBeenCalledWith(bookmarkData);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('bookmark_created', createdBookmark);
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', url: 'https://example.com' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockCreateBookmark).not.toHaveBeenCalled();
    });

    it('returns 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', url: 'https://example.com' }),
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
      mockCreateBookmark.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', url: 'https://example.com' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create bookmark');
    });
  });
});
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
  getBookmarkById: jest.fn(),
  updateBookmark: jest.fn(),
  deleteBookmark: jest.fn(),
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
jest.mock('../../../events/route', () => ({
  broadcastEvent: jest.fn(),
}));

import { getBookmarkById, updateBookmark, deleteBookmark } from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { broadcastEvent } from '../../../events/route';
import { GET, PUT, DELETE } from '../route';

const mockGetBookmarkById = getBookmarkById as jest.MockedFunction<typeof getBookmarkById>;
const mockUpdateBookmark = updateBookmark as jest.MockedFunction<typeof updateBookmark>;
const mockDeleteBookmark = deleteBookmark as jest.MockedFunction<typeof deleteBookmark>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockBroadcastEvent = broadcastEvent as jest.MockedFunction<typeof broadcastEvent>;

describe('/api/bookmarks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bookmarks/[id]', () => {
    it('returns bookmark for admin user', async () => {
      const mockBookmark = createMockBookmark();
      mockGetBookmarkById.mockReturnValue(mockBookmark);
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockBookmark);
      expect(mockGetBookmarkById).toHaveBeenCalledWith(1, true);
    });

    it('returns public bookmark for non-admin user', async () => {
      const mockBookmark = createMockBookmark({ is_private: false });
      mockGetBookmarkById.mockReturnValue(mockBookmark);
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1');
      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockGetBookmarkById).toHaveBeenCalledWith(1, false);
    });

    it('returns public bookmark when not authenticated', async () => {
      const mockBookmark = createMockBookmark({ is_private: false });
      mockGetBookmarkById.mockReturnValue(mockBookmark);
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1');
      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockGetBookmarkById).toHaveBeenCalledWith(1, false);
    });

    it('returns 404 when bookmark not found', async () => {
      mockGetBookmarkById.mockReturnValue(null);
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Bookmark not found');
    });

    it('returns 400 for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/invalid');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid bookmark ID');
    });

    it('returns 500 on database error', async () => {
      mockGetBookmarkById.mockImplementation(() => {
        throw new Error('Database error');
      });
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch bookmark');
    });
  });

  describe('PUT /api/bookmarks/[id]', () => {
    it('updates bookmark for authenticated admin', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedBookmark = createMockBookmark(updateData);

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockUpdateBookmark.mockReturnValue(updatedBookmark);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedBookmark);
      expect(mockUpdateBookmark).toHaveBeenCalledWith(1, updateData);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('bookmark_updated', updatedBookmark);
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockUpdateBookmark).not.toHaveBeenCalled();
    });

    it('returns 404 when bookmark not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockUpdateBookmark.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Bookmark not found');
    });

    it('returns 400 for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/invalid', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid bookmark ID');
    });
  });

  describe('DELETE /api/bookmarks/[id]', () => {
    it('deletes bookmark for authenticated admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockDeleteBookmark.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteBookmark).toHaveBeenCalledWith(1);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('bookmark_deleted', { id: 1 });
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockDeleteBookmark).not.toHaveBeenCalled();
    });

    it('returns 404 when bookmark not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockDeleteBookmark.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/bookmarks/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Bookmark not found');
    });

    it('returns 400 for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/bookmarks/invalid', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid bookmark ID');
    });
  });
});
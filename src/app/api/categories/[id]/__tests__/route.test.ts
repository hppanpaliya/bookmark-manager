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
  getCategoryById: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
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

import { getCategoryById, updateCategory, deleteCategory } from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { broadcastEvent } from '../../../events/route';
import { GET, PUT, DELETE } from '../route';

const mockGetCategoryById = getCategoryById as jest.MockedFunction<typeof getCategoryById>;
const mockUpdateCategory = updateCategory as jest.MockedFunction<typeof updateCategory>;
const mockDeleteCategory = deleteCategory as jest.MockedFunction<typeof deleteCategory>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockBroadcastEvent = broadcastEvent as jest.MockedFunction<typeof broadcastEvent>;

describe('/api/categories/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories/[id]', () => {
    it('returns category', async () => {
      const mockCategory = createMockCategory();
      mockGetCategoryById.mockReturnValue(mockCategory);

      const request = new NextRequest('http://localhost:3000/api/categories/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategory);
      expect(mockGetCategoryById).toHaveBeenCalledWith(1);
    });

    it('returns 404 when category not found', async () => {
      mockGetCategoryById.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/categories/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('returns 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories/invalid');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid category ID');
    });

    it('returns 500 on database error', async () => {
      mockGetCategoryById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new NextRequest('http://localhost:3000/api/categories/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch category');
    });
  });

  describe('PUT /api/categories/[id]', () => {
    it('updates category for authenticated admin', async () => {
      const updateData = { name: 'Updated Category' };
      const updatedCategory = createMockCategory(updateData);

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockUpdateCategory.mockReturnValue(updatedCategory);

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedCategory);
      expect(mockUpdateCategory).toHaveBeenCalledWith(1, updateData);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('category_updated', updatedCategory);
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });

    it('returns 404 when category not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockUpdateCategory.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('returns 400 for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/categories/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid category ID');
    });
  });

  describe('DELETE /api/categories/[id]', () => {
    it('deletes category for authenticated admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockDeleteCategory.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteCategory).toHaveBeenCalledWith(1);
      expect(mockBroadcastEvent).toHaveBeenCalledWith('category_deleted', { id: 1 });
    });

    it('returns 401 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });

    it('returns 404 when category not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });
      mockDeleteCategory.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/categories/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('returns 400 for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const request = new NextRequest('http://localhost:3000/api/categories/invalid', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid category ID');
    });
  });
});
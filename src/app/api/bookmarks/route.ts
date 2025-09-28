import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAllBookmarks, createBookmark } from '@/lib/database';
import { BookmarkCreateInput, SearchFilters, PaginationOptions } from '@/types';
import { broadcastEvent } from '../events/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const { searchParams } = new URL(request.url);

    // Parse search filters
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      category_id: searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined,
      is_private: searchParams.get('is_private') ? searchParams.get('is_private') === 'true' : undefined,
      sort_by: (searchParams.get('sort_by') as 'created_at' | 'title' | 'updated_at') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    // Parse pagination
    const pagination: PaginationOptions = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    };

    const result = getAllBookmarks(filters, pagination, isAdmin);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const bookmark = createBookmark(body as BookmarkCreateInput);

    // Broadcast the new bookmark to all connected clients
    broadcastEvent('bookmark_created', bookmark);

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}
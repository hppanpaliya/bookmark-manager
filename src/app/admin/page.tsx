'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Bookmark, Category, SearchFilters, BookmarkListResponse } from '@/types';
import { BookmarkCard } from '@/components/BookmarkCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { BookmarkForm } from '@/components/BookmarkForm';
import { Button } from '@/components/ui/Button';
import { useSSE } from '@/lib/useSSE';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [showPrivate, setShowPrivate] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  const fetchBookmarks = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (filters.query) params.append('query', filters.query);
      if (filters.category_id) params.append('category_id', filters.category_id.toString());
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (showPrivate !== undefined) params.append('is_private', showPrivate.toString());

      const response = await fetch(`/api/bookmarks?${params}`);
      const data: BookmarkListResponse = await response.json();
      setBookmarks(data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  }, [filters.query, filters.category_id, filters.sort_by, filters.sort_order, showPrivate]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      const loadData = async () => {
        if (initialLoad) {
          setLoading(true);
        }
        await Promise.all([fetchBookmarks(), fetchCategories()]);
        setLoading(false);
        setInitialLoad(false);
      };

      loadData();
    }
  }, [session?.user?.role, fetchBookmarks, fetchCategories, initialLoad]);

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleCategoryChange = (categoryId?: number) => {
    setFilters(prev => ({ ...prev, category_id: categoryId }));
  };

  const handleSortChange = (sortBy: 'created_at' | 'title' | 'updated_at', sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
  };

  const handleFormSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormLoading(true);
    try {
      const url = editingBookmark ? `/api/bookmarks/${editingBookmark.id}` : '/api/bookmarks';
      const method = editingBookmark ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingBookmark(undefined);
        // Don't manually fetch - SSE will handle updates
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete bookmark');
      }
      // Don't manually fetch - SSE will handle updates
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  // SSE for real-time updates in admin
  useSSE({
    onBookmarkCreated: (bookmark) => {
      // Check if it matches current filters
      if (!filters.query || bookmark.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          bookmark.description?.toLowerCase().includes(filters.query.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(filters.query.toLowerCase())) {
        if (!filters.category_id || bookmark.category_id === filters.category_id) {
          if (showPrivate === undefined || bookmark.is_private === showPrivate) {
            setBookmarks(prev => [bookmark, ...prev]);
          }
        }
      }
    },
    onBookmarkUpdated: (bookmark) => {
      setBookmarks(prev => prev.map(b => b.id === bookmark.id ? bookmark : b));
    },
    onBookmarkDeleted: ({ id }) => {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    },
    onCategoryCreated: (category) => {
      setCategories(prev => [...prev, category]);
    },
    onCategoryUpdated: (category) => {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    },
    onCategoryDeleted: ({ id }) => {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  });

  if (status === 'loading' || (!session && status !== 'unauthenticated')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your bookmarks and categories</p>
            </div>

            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline">
                  View Public Site
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut size={20} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-3">
          <Button
            onClick={() => {
              setEditingBookmark(undefined);
              setShowForm(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            Add Bookmark
          </Button>
          <Link href="/admin/categories">
            <Button variant="outline">
              Manage Categories
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="max-w-md">
            <SearchBar
              value={filters.query || ''}
              onChange={handleSearchChange}
              placeholder="Search bookmarks..."
            />
          </div>

          <FilterPanel
            categories={categories}
            selectedCategory={filters.category_id}
            sortBy={filters.sort_by || 'created_at'}
            sortOrder={filters.sort_order || 'desc'}
            showPrivate={showPrivate}
            onCategoryChange={handleCategoryChange}
            onSortChange={handleSortChange}
            onPrivateToggle={setShowPrivate}
            isAdmin={true}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Bookmarks Grid */}
        {!loading && (
          <>
            {bookmarks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-gray-500">
                  {filters.query || filters.category_id ? (
                    <div>
                      <p className="text-lg mb-2">No bookmarks found</p>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">No bookmarks yet</p>
                      <p>Create your first bookmark to get started!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence>
                  {bookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      isAdmin={true}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Stats */}
            {bookmarks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center text-sm text-gray-500"
              >
                Managing {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bookmark Form Modal */}
      <AnimatePresence>
        {showForm && (
          <BookmarkForm
            bookmark={editingBookmark}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBookmark(undefined);
            }}
            isLoading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
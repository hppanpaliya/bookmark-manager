'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Sparkles, Globe, LogOut } from 'lucide-react';

import {
  Bookmark,
  Category,
  SearchFilters,
  BookmarkListResponse,
  BookmarkCreateInput,
  BookmarkUpdateInput,
} from '@/types';
import { BookmarkCard } from '@/components/BookmarkCard';
import { BookmarkForm } from '@/components/BookmarkForm';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, VisibilityFilter } from '@/components/FilterPanel';
import { Button } from '@/components/ui/Button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useSSE } from '@/lib/useSSE';

interface BookmarkDashboardProps {
  variant: 'public' | 'admin';
  isAdminUser: boolean;
  onLogout?: () => void;
}

export function BookmarkDashboard({ variant, isAdminUser, onLogout }: BookmarkDashboardProps) {
  const isAdminView = variant === 'admin';

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
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');

  const matchesVisibility = useCallback(
    (bookmark: Bookmark) => {
      if (isAdminView) {
        if (visibilityFilter === 'all') return true;
        if (visibilityFilter === 'public') return !bookmark.is_private;
        return bookmark.is_private;
      }

      // Public view: admins can see all, non-admins only public
      return isAdminUser || !bookmark.is_private;
    },
    [isAdminView, visibilityFilter, isAdminUser]
  );

  const matchesFilters = useCallback(
    (bookmark: Bookmark) => {
      const matchesQuery =
        !filters.query ||
        bookmark.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(filters.query.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(filters.query.toLowerCase());

      const matchesCategory = !filters.category_id || bookmark.category_id === filters.category_id;

      return matchesQuery && matchesCategory && matchesVisibility(bookmark);
    },
    [filters.query, filters.category_id, matchesVisibility]
  );

  const fetchBookmarks = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (filters.query) params.append('query', filters.query);
      if (filters.category_id) params.append('category_id', filters.category_id.toString());
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      if (isAdminView) {
        if (visibilityFilter === 'public') {
          params.append('is_private', 'false');
        } else if (visibilityFilter === 'private') {
          params.append('is_private', 'true');
        }
      } else if (!isAdminUser) {
        params.append('is_private', 'false');
      }

      const response = await fetch(`/api/bookmarks?${params.toString()}`);
      const data: BookmarkListResponse = await response.json();
      setBookmarks(data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  }, [filters, isAdminView, visibilityFilter, isAdminUser]);

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
    if (isAdminView && !isAdminUser) {
      return; // Admin view should only run when admin user is confirmed
    }

    const loadData = async () => {
      if (initialLoad) {
        setLoading(true);
      }
      await Promise.all([fetchBookmarks(), fetchCategories()]);
      setLoading(false);
      setInitialLoad(false);
    };

    loadData();
  }, [fetchBookmarks, fetchCategories, initialLoad, isAdminView, isAdminUser]);

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleCategoryChange = (categoryId?: number) => {
    setFilters(prev => ({ ...prev, category_id: categoryId }));
  };

  const handleSortChange = (sortBy: 'created_at' | 'title' | 'updated_at', sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
  };

  const handleVisibilityChange = (filter: VisibilityFilter) => {
    setVisibilityFilter(filter);
  };

  const handleFormSubmit = async (data: BookmarkCreateInput | BookmarkUpdateInput) => {
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
        // Updates handled via SSE
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

  const handleAdd = () => {
    setEditingBookmark(undefined);
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
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBookmark(undefined);
  };

  useSSE({
    onBookmarkCreated: (bookmark) => {
      if (matchesFilters(bookmark)) {
        setBookmarks(prev => [bookmark, ...prev]);
      }
    },
    onBookmarkUpdated: (bookmark) => {
      setBookmarks(prev => prev.map(b => (b.id === bookmark.id ? bookmark : b)));
    },
    onBookmarkDeleted: ({ id }) => {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    },
    onCategoryCreated: (category) => {
      setCategories(prev => [...prev, category]);
    },
    onCategoryUpdated: (category) => {
      setCategories(prev => prev.map(c => (c.id === category.id ? category : c)));
    },
    onCategoryDeleted: ({ id }) => {
      setCategories(prev => prev.filter(c => c.id !== id));
    },
  });

  const searchPlaceholder = useMemo(
    () => (isAdminView ? 'Search bookmarks...' : '🔍 Search your bookmarks...'),
    [isAdminView]
  );

  const statsLabel = useMemo(() => {
    const count = bookmarks.length;
    if (isAdminView) {
      return `Managing ${count} bookmark${count !== 1 ? 's' : ''}`;
    }
    return `Showing ${count} bookmark${count !== 1 ? 's' : ''}`;
  }, [bookmarks.length, isAdminView]);

  const showAdminControls = isAdminView || isAdminUser;

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300">
      {/* Header */}
      {isAdminView ? (
        <header className="bg-[var(--card)] shadow-sm border-b border-[var(--card-border)] glass-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LinkVault Admin
                </h1>
                <p className="text-[var(--muted-foreground)]">Manage your bookmarks and categories</p>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <ThemeSwitcher />
                <Link href="/">
                  <Button variant="outline">View Public Site</Button>
                </Link>
                {onLogout && (
                  <Button variant="outline" onClick={onLogout}>
                    <LogOut size={20} className="mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="bg-[var(--card)] border-b border-[var(--card-border)] glass-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      LinkVault
                    </h1>
                    <p className="text-[var(--muted-foreground)] text-sm">Your digital bookmark sanctuary</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col sm:flex-row gap-3 items-center">
                <ThemeSwitcher />
                {isAdminUser ? (
                  <Link href="/admin">
                    <Button variant="outline" className="gap-2">
                      <Settings size={18} />
                      Admin Panel
                    </Button>
                  </Link>
                ) : (
                  <Link href="/admin/login">
                    <Button className="gap-2">
                      <Globe size={18} />
                      Admin Login
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons (Admin View) */}
        {isAdminView && (
          <div className="mb-8 flex flex-wrap gap-3">
            <Button onClick={handleAdd}>
              <Plus size={20} className="mr-2" />
              Add Bookmark
            </Button>
            <Link href="/admin/categories">
              <Button variant="outline">Manage Categories</Button>
            </Link>
          </div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-6"
        >
          <div className="w-full max-w-md">
            <SearchBar value={filters.query || ''} onChange={handleSearchChange} placeholder={searchPlaceholder} />
          </div>

          <FilterPanel
            categories={categories}
            selectedCategory={filters.category_id}
            sortBy={filters.sort_by || 'created_at'}
            sortOrder={filters.sort_order || 'desc'}
            visibilityFilter={isAdminView ? visibilityFilter : undefined}
            onCategoryChange={handleCategoryChange}
            onSortChange={handleSortChange}
            onVisibilityChange={isAdminView ? handleVisibilityChange : undefined}
          />
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--muted)] border-t-[var(--primary)]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[var(--primary)] animate-pulse" />
              </div>
            </div>
            <p className="text-[var(--muted-foreground)] mt-4 text-sm">Loading your bookmarks...</p>
          </motion.div>
        )}

        {/* Bookmarks Grid */}
        {!loading && (
          <>
            {bookmarks.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                {isAdminView ? (
                  <div className="text-[var(--muted-foreground)]">
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
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="bg-[var(--card)] rounded-2xl p-8 card-shadow glass-card">
                      <div className="text-6xl mb-4">📖</div>
                      {filters.query || filters.category_id ? (
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No bookmarks found</h3>
                          <p className="text-[var(--muted-foreground)] mb-4">Try adjusting your search terms or filters</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setFilters({ sort_by: 'created_at', sort_order: 'desc' });
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Your vault is empty</h3>
                          <p className="text-[var(--muted-foreground)] mb-4">
                            {isAdminUser ? 'Start curating your digital collection!' : 'Ask your admin to add some bookmarks!'}
                          </p>
                          {isAdminUser && (
                            <Link href="/admin">
                              <Button className="gap-2">
                                <Plus size={18} />
                                Add Your First Bookmark
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  isAdminView
                    ? 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
                <AnimatePresence mode="popLayout">
                  {bookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { delay: isAdminView ? 0 : index * 0.05 },
                      }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      layout
                    >
                      <BookmarkCard
                        bookmark={bookmark}
                        isAdmin={showAdminControls}
                        onEdit={showAdminControls ? handleEdit : undefined}
                        onDelete={showAdminControls ? handleDelete : undefined}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Stats */}
            {bookmarks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center"
              >
                <div className="inline-flex items-center gap-2 bg-[var(--card)] px-4 py-2 rounded-full card-shadow glass-card text-[var(--muted-foreground)] text-sm">
                  <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                  <span>{statsLabel}</span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (visible to admins on public view) */}
      {!isAdminView && isAdminUser && (
        <Link href="/admin">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 group"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-2xl cursor-pointer glass-button relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus size={24} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            </div>
          </motion.div>
        </Link>
      )}

      <AnimatePresence>
        {showForm && (
          <BookmarkForm
            bookmark={editingBookmark}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/PageTransition';
import { NavigationLink } from '@/components/NavigationLink';
import { LoadingSpinner } from '@/components/Skeleton';

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', emoji: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as ExtendedUser)?.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((session?.user as ExtendedUser)?.role === 'admin') {
      fetchCategories();
    }
  }, [session]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingCategory(undefined);
        setFormData({ name: '', color: '#3B82F6', emoji: '' });
        await fetchCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, color: category.color, emoji: category.emoji || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? Bookmarks using this category will have their category removed.')) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(undefined);
    setFormData({ name: '', color: '#3B82F6', emoji: '' });
  };

  if (status === 'loading' || (!session && status !== 'unauthenticated')) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!session || (session.user as ExtendedUser)?.role !== 'admin') {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[var(--card)] shadow-sm border-b border-[var(--border)] sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <NavigationLink
                href="/admin"
                className="text-[var(--foreground)] hover:text-[var(--primary)]"
                activeClassName="bg-[var(--primary)]/10 text-[var(--primary)]"
              >
                <Button variant="ghost" size="sm">
                  <ArrowLeft size={20} className="mr-2" />
                  Back to Admin
                </Button>
              </NavigationLink>
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Categories</h1>
                <p className="text-[var(--muted-foreground)]">Organize your bookmarks with categories</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => {
                  setEditingCategory(undefined);
                  setFormData({ name: '', color: '#3B82F6', emoji: '' });
                  setShowForm(true);
                }}
              >
                <Plus size={20} className="mr-2" />
                Add Category
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-8"
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-16 border border-[var(--border)] rounded cursor-pointer"
                    />
                    <div
                      className="px-3 py-2 rounded-md text-white text-sm font-medium flex items-center gap-2"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.emoji && <span>{formData.emoji}</span>}
                      <span>{formData.name || 'Preview'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="emoji" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Emoji (optional)
                  </label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    placeholder="🎯"
                    maxLength={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-32" />
                    <div className="h-3 bg-[var(--muted)] rounded animate-pulse w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-8 w-8 bg-[var(--muted)] rounded animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-[var(--muted-foreground)]">
              <p className="text-lg mb-2">No categories yet</p>
              <p>Create your first category to organize your bookmarks!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {category.emoji ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.emoji}
                    </div>
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">{category.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Created {new Date(category.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-[var(--destructive)] hover:opacity-80"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
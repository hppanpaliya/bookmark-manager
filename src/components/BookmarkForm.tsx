'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { Bookmark, Category, BookmarkCreateInput, BookmarkUpdateInput } from '@/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';

interface BookmarkFormProps {
  bookmark?: Bookmark;
  categories: Category[];
  onSubmit: (data: BookmarkCreateInput | BookmarkUpdateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BookmarkForm({ bookmark, categories, onSubmit, onCancel, isLoading = false }: BookmarkFormProps) {
  const [formData, setFormData] = useState({
    title: bookmark?.title || '',
    url: bookmark?.url || '',
    description: bookmark?.description || '',
    username: bookmark?.username || '',
    password: bookmark?.password || '',
    category_id: bookmark?.category_id || undefined,
    is_private: bookmark?.is_private || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      category_id: formData.category_id || undefined,
      description: formData.description || undefined,
      username: formData.username || undefined,
      password: formData.password || undefined,
    };

    await onSubmit(submitData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-[var(--card)] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--border)]"
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-semibold text-[var(--foreground)]"
          >
            {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X size={20} />
            </Button>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Title *
            </label>
            <motion.div
              animate={errors.title ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-[var(--destructive)] focus:border-[var(--destructive)]' : ''}
              />
            </motion.div>
            {errors.title && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--destructive)] text-xs mt-1"
              >
                {errors.title}
              </motion.p>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              URL *
            </label>
            <motion.div
              animate={errors.url ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className={errors.url ? 'border-[var(--destructive)] focus:border-[var(--destructive)]' : ''}
              />
            </motion.div>
            {errors.url && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--destructive)] text-xs mt-1"
              >
                {errors.url}
              </motion.p>
            )}
          </div>

                    <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Login Credentials (Optional)</h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="is_private"
              type="checkbox"
              checked={formData.is_private}
              onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
              className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--ring)] border-[var(--border)] rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-[var(--foreground)]">
              Keep this bookmark private
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </motion.div>
                ) : (
                  bookmark ? 'Update' : 'Add'
                )} Bookmark
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
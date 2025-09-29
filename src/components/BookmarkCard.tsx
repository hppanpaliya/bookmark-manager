'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Lock, Edit, Trash2, User, Key, Eye, EyeOff } from 'lucide-react';
import { Bookmark } from '@/types';
import { formatDate, getDomainFromUrl } from '@/lib/utils';
import { Button } from './ui/Button';

interface BookmarkCardProps {
  bookmark: Bookmark;
  isAdmin?: boolean;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (id: number) => void;
}

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

export function BookmarkCard({ bookmark, isAdmin = false, onEdit, onDelete }: BookmarkCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 sm:p-6 card-shadow card-hover glass-card transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">
              {bookmark.title}
            </h3>
            {bookmark.is_private && (
              <Lock size={16} className="text-[var(--muted-foreground)] flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
            {getFaviconUrl(bookmark.url) && (
              <img
                src={getFaviconUrl(bookmark.url)!}
                alt=""
                className="w-6 h-6 rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="font-mono text-xs bg-[var(--muted)] px-2 py-1 rounded-full">
              {getDomainFromUrl(bookmark.url)}
            </span>
            <span>•</span>
            <span>{formatDate(bookmark.created_at)}</span>
          </div>

          {bookmark.description && (
            <p className="text-[var(--foreground)] opacity-80 text-sm mb-3 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {bookmark.category && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white mb-3"
              style={{ backgroundColor: bookmark.category.color }}
            >
              {bookmark.category.emoji && <span className="mr-1">{bookmark.category.emoji}</span>}
              {bookmark.category.name}
            </span>
          )}

          {isAdmin && (bookmark.username || bookmark.password) && (
            <div className="flex gap-4 text-xs text-[var(--muted-foreground)] mb-3">
              {bookmark.username && (
                <div className="flex items-center gap-1 bg-[var(--muted)] px-2 py-1 rounded">
                  <User size={12} />
                  <span className="font-mono">{bookmark.username}</span>
                </div>
              )}
              {bookmark.password && (
                <div className="flex items-center gap-1 bg-[var(--muted)] px-2 py-1 rounded">
                  <Key size={12} />
                  <span className="font-mono">
                    {showPassword ? bookmark.password : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-3">
        <motion.a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 text-[var(--primary)] hover:opacity-80 transition-all font-medium px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20"
        >
          <ExternalLink size={16} />
          <span className="text-sm">Visit</span>
        </motion.a>

        {isAdmin && (
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(bookmark)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              >
                <Edit size={16} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(bookmark.id)}
                className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)] hover:bg-opacity-10"
              >
                <Trash2 size={16} />
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
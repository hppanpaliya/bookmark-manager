'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Lock, Edit, Trash2, User, Key } from 'lucide-react';
import { Bookmark } from '@/types';
import { formatDate, getDomainFromUrl } from '@/lib/utils';
import { Button } from './ui/Button';

interface BookmarkCardProps {
  bookmark: Bookmark;
  isAdmin?: boolean;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (id: number) => void;
}

export function BookmarkCard({ bookmark, isAdmin = false, onEdit, onDelete }: BookmarkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {bookmark.title}
            </h3>
            {bookmark.is_private && (
              <Lock size={16} className="text-gray-500 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span>{getDomainFromUrl(bookmark.url)}</span>
            <span>•</span>
            <span>{formatDate(bookmark.created_at)}</span>
          </div>

          {bookmark.description && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {bookmark.category && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white mb-3"
              style={{ backgroundColor: bookmark.category.color }}
            >
              {bookmark.category.name}
            </span>
          )}

          {isAdmin && (bookmark.username || bookmark.password) && (
            <div className="flex gap-4 text-xs text-gray-500 mb-3">
              {bookmark.username && (
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span className="font-mono">{bookmark.username}</span>
                </div>
              )}
              {bookmark.password && (
                <div className="flex items-center gap-1">
                  <Key size={12} />
                  <span className="font-mono">••••••••</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink size={16} />
          <span className="text-sm font-medium">Visit</span>
        </a>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(bookmark)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(bookmark.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
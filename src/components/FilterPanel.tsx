'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, Filter, Eye } from 'lucide-react';
import { Category } from '@/types';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

export type VisibilityFilter = 'all' | 'public' | 'private';

interface FilterPanelProps {
  categories: Category[];
  selectedCategory?: number;
  sortBy: 'created_at' | 'title' | 'updated_at';
  sortOrder: 'asc' | 'desc';
  visibilityFilter?: VisibilityFilter;
  onCategoryChange: (categoryId?: number) => void;
  onSortChange: (sortBy: 'created_at' | 'title' | 'updated_at', sortOrder: 'asc' | 'desc') => void;
  onVisibilityChange?: (filter: VisibilityFilter) => void;
}

export function FilterPanel({
  categories,
  selectedCategory,
  sortBy,
  sortOrder,
  visibilityFilter = 'all',
  onCategoryChange,
  onSortChange,
  onVisibilityChange,
}: FilterPanelProps) {
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Categories';

  const visibilityOptions = [
    { key: 'all', label: 'All Bookmarks', icon: '🌐' },
    { key: 'public', label: 'Public Only', icon: '👁️' },
    { key: 'private', label: 'Private Only', icon: '🔒' },
  ] as const;

  const currentVisibilityLabel = visibilityOptions.find(opt => opt.key === visibilityFilter)?.label || 'All Bookmarks';
  const currentVisibilityIcon = visibilityOptions.find(opt => opt.key === visibilityFilter)?.icon || '🌐';

  const sortOptions = [
    { key: 'created_at', label: 'Date Created' },
    { key: 'updated_at', label: 'Date Updated' },
    { key: 'title', label: 'Title' },
  ] as const;

  const currentSortLabel = sortOptions.find(opt => opt.key === sortBy)?.label || 'Date Created';

  return (
    <div className="flex flex-wrap gap-3 items-start md:items-center">
      {/* Category Filter */}
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            as={Button}
            variant="outline"
      className="inline-flex w-full justify-center gap-x-1.5 rounded-2xl bg-[color-mix(in srgb, var(--card) 88%, transparent 12%)] px-5 py-2 text-sm"
          >
            <Filter className="h-4 w-4" />
            {selectedCategoryName}
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95 translate-y-1"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100 translate-y-0"
          leaveTo="transform opacity-0 scale-95 translate-y-1"
        >
          <Menu.Items className="absolute left-0 z-50 mt-2 w-56 origin-top-left overflow-hidden rounded-3xl border border-[color-mix(in srgb, var(--primary) 18%, var(--card-border))] bg-[color-mix(in srgb, var(--card) 92%, transparent 8%)] shadow-[var(--shadow-card)]/45 backdrop-blur">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onCategoryChange(undefined)}
                    className={cn(
                      active
                        ? 'bg-[color-mix(in srgb, var(--primary) 18%, transparent)] text-[var(--primary-foreground)]'
                        : 'text-[var(--foreground)]',
                      'block w-full px-4 py-2 text-sm text-left transition-colors'
                    )}
                  >
                    All Categories
                  </button>
                )}
              </Menu.Item>
              {categories.map((category) => (
                <Menu.Item key={category.id}>
                  {({ active }) => (
                    <button
                      onClick={() => onCategoryChange(category.id)}
                      className={cn(
                        active
                          ? 'bg-[color-mix(in srgb, rgba(255,255,255,0.07) 60%, transparent)] text-[var(--foreground)]'
                          : 'text-[color-mix(in srgb, var(--muted-foreground) 85%, transparent 15%)]',
                        'block w-full px-4 py-2 text-sm text-left transition-colors'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                        {selectedCategory === category.id && <span className="ml-auto text-xs">✓</span>}
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Sort Options */}
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            as={Button}
            variant="outline"
      className="inline-flex w-full justify-center gap-x-1.5 rounded-2xl bg-[color-mix(in srgb, var(--card) 88%, transparent 12%)] px-5 py-2 text-sm"
          >
            {currentSortLabel} ({sortOrder === 'asc' ? '↑' : '↓'})
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95 translate-y-1"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100 translate-y-0"
          leaveTo="transform opacity-0 scale-95 translate-y-1"
        >
          <Menu.Items className="absolute left-0 z-50 mt-2 w-48 origin-top-left overflow-hidden rounded-3xl border border-[color-mix(in srgb, var(--primary) 18%, var(--card-border))] bg-[color-mix(in srgb, var(--card) 92%, transparent 8%)] shadow-[var(--shadow-card)]/45 backdrop-blur">
            <div className="py-1">
              {sortOptions.map((option) => (
                <Fragment key={option.key}>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onSortChange(option.key, 'desc')}
                        className={cn(
                          active
                            ? 'bg-[color-mix(in srgb, var(--primary) 20%, transparent)] text-[var(--primary-foreground)]'
                            : 'text-[var(--foreground)]',
                          'block w-full px-4 py-2 text-sm text-left transition-colors'
                        )}
                      >
                        {option.label} (Newest First)
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onSortChange(option.key, 'asc')}
                        className={cn(
                          active
                            ? 'bg-[color-mix(in srgb, var(--primary) 20%, transparent)] text-[var(--primary-foreground)]'
                            : 'text-[var(--foreground)]',
                          'block w-full px-4 py-2 text-sm text-left transition-colors'
                        )}
                      >
                        {option.label} (Oldest First)
                      </button>
                    )}
                  </Menu.Item>
                </Fragment>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Visibility Filter Dropdown */}
      {onVisibilityChange && (
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button
              as={Button}
              variant="outline"
              className="inline-flex w-full justify-center gap-x-1.5 rounded-2xl bg-[color-mix(in srgb, var(--card) 88%, transparent 12%)] px-5 py-2 text-sm"
            >
              <Eye className="h-4 w-4" />
              {currentVisibilityIcon} {currentVisibilityLabel}
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95 translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 translate-y-1"
          >
            <Menu.Items className="absolute left-0 z-50 mt-2 w-48 origin-top-left overflow-hidden rounded-3xl border border-[color-mix(in srgb, var(--primary) 18%, var(--card-border))] bg-[color-mix(in srgb, var(--card) 92%, transparent 8%)] shadow-[var(--shadow-card)]/45 backdrop-blur">
              <div className="py-1">
                {visibilityOptions.map((option) => (
                  <Menu.Item key={option.key}>
                    {({ active }) => (
                      <button
                        onClick={() => onVisibilityChange(option.key)}
                        className={cn(
                          active
                            ? 'bg-[color-mix(in srgb, var(--primary) 20%, transparent)] text-[var(--primary-foreground)]'
                            : 'text-[var(--foreground)]',
                          'block w-full px-4 py-2 text-sm text-left transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                          {visibilityFilter === option.key && (
                            <span className="ml-auto text-xs">✓</span>
                          )}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
}
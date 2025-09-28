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
  isAdmin?: boolean;
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
  isAdmin = false,
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
          <Menu.Button as={Button} variant="outline" className="inline-flex w-full justify-center gap-x-1.5">
            <Filter className="h-4 w-4" />
            {selectedCategoryName}
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-[var(--card)] shadow-lg ring-1 ring-[var(--card-border)] focus:outline-none border border-[var(--card-border)]">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onCategoryChange(undefined)}
                    className={cn(
                      active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
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
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full px-4 py-2 text-sm text-left'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
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
          <Menu.Button as={Button} variant="outline" className="inline-flex w-full justify-center gap-x-1.5">
            {currentSortLabel} ({sortOrder === 'asc' ? '↑' : '↓'})
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[var(--card)] shadow-lg ring-1 ring-[var(--card-border)] focus:outline-none border border-[var(--card-border)]">
            <div className="py-1">
              {sortOptions.map((option) => (
                <Fragment key={option.key}>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onSortChange(option.key, 'desc')}
                        className={cn(
                          active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
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
                          active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
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
            <Menu.Button as={Button} variant="outline" className="inline-flex w-full justify-center gap-x-1.5">
              <Eye className="h-4 w-4" />
              {currentVisibilityIcon} {currentVisibilityLabel}
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[var(--card)] shadow-lg ring-1 ring-[var(--card-border)] focus:outline-none border border-[var(--card-border)]">
              <div className="py-1">
                {visibilityOptions.map((option) => (
                  <Menu.Item key={option.key}>
                    {({ active }) => (
                      <button
                        onClick={() => onVisibilityChange(option.key)}
                        className={cn(
                          active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
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
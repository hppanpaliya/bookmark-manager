'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, Filter } from 'lucide-react';
import { Category } from '@/types';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  categories: Category[];
  selectedCategory?: number;
  sortBy: 'created_at' | 'title' | 'updated_at';
  sortOrder: 'asc' | 'desc';
  showPrivate?: boolean;
  onCategoryChange: (categoryId?: number) => void;
  onSortChange: (sortBy: 'created_at' | 'title' | 'updated_at', sortOrder: 'asc' | 'desc') => void;
  onPrivateToggle?: (showPrivate: boolean) => void;
  isAdmin?: boolean;
}

export function FilterPanel({
  categories,
  selectedCategory,
  sortBy,
  sortOrder,
  showPrivate,
  onCategoryChange,
  onSortChange,
  onPrivateToggle,
  isAdmin = false,
}: FilterPanelProps) {
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Categories';

  const sortOptions = [
    { key: 'created_at', label: 'Date Created' },
    { key: 'updated_at', label: 'Date Updated' },
    { key: 'title', label: 'Title' },
  ] as const;

  const currentSortLabel = sortOptions.find(opt => opt.key === sortBy)?.label || 'Date Created';

  return (
    <div className="flex flex-wrap gap-3 items-center">
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
          <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onCategoryChange(undefined)}
                    className={cn(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block w-full px-4 py-2 text-sm text-left'
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
          <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {sortOptions.map((option) => (
                <Fragment key={option.key}>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onSortChange(option.key, 'desc')}
                        className={cn(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full px-4 py-2 text-sm text-left'
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
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full px-4 py-2 text-sm text-left'
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

      {/* Private Toggle (Admin Only) */}
      {isAdmin && onPrivateToggle && (
        <Button
          variant={showPrivate ? 'default' : 'outline'}
          onClick={() => onPrivateToggle(!showPrivate)}
          className="text-sm"
        >
          {showPrivate ? 'Showing Private' : 'Show Private'}
        </Button>
      )}
    </div>
  );
}
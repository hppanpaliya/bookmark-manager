'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Palette } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button as={Button} variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {availableThemes[theme].emoji} {availableThemes[theme].name}
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
        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-[var(--card)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--card-border)]">
          <div className="py-1">
            {Object.entries(availableThemes).map(([themeKey, themeConfig]) => (
              <Menu.Item key={themeKey}>
                {({ active }) => (
                  <button
                    onClick={() => setTheme(themeKey as 'light' | 'dark' | 'black' | 'glass')}
                    className={cn(
                      'group flex w-full items-center px-4 py-2 text-sm transition-colors',
                      active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
                      theme === themeKey && 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    )}
                  >
                    <span className="mr-3 text-lg">{themeConfig.emoji}</span>
                    <span>{themeConfig.name}</span>
                    {theme === themeKey && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
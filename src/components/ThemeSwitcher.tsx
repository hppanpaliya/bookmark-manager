'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes, isTransitioning } = useTheme();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          as={Button}
          variant="outline"
          size="sm"
          disabled={isTransitioning}
          className={cn(
            "inline-flex items-center gap-2 transition-all duration-200",
            isTransitioning && "opacity-50 cursor-not-allowed"
          )}
        >
          <motion.div
            animate={{ rotate: isTransitioning ? 360 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Palette className="h-4 w-4" />
          </motion.div>
          {availableThemes[theme].emoji} {availableThemes[theme].name}
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
        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-[var(--card)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--card-border)]">
          <div className="py-1">
            {Object.entries(availableThemes).map(([themeKey, themeConfig]) => (
              <Menu.Item key={themeKey}>
                {({ active }) => (
                  <motion.button
                    onClick={() => setTheme(themeKey as 'light' | 'dark' | 'black' | 'glass')}
                    disabled={isTransitioning}
                    className={cn(
                      'group flex w-full items-center px-4 py-2 text-sm transition-all duration-200',
                      active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--foreground)]',
                      theme === themeKey && 'bg-[var(--primary)] text-[var(--primary-foreground)]',
                      isTransitioning && 'opacity-50 cursor-not-allowed'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="mr-3 text-lg"
                      animate={{
                        rotate: theme === themeKey ? [0, 10, -10, 0] : 0,
                        scale: theme === themeKey ? [1, 1.2, 1] : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {themeConfig.emoji}
                    </motion.span>
                    <span>{themeConfig.name}</span>
                    {theme === themeKey && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-xs"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
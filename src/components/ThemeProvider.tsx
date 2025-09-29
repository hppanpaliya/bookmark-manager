'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme, themes, ThemeConfig } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  availableThemes: Record<Theme, ThemeConfig>;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const applyTheme = async (newTheme: Theme) => {
      setIsTransitioning(true);

      // Save theme to localStorage
      localStorage.setItem('theme', newTheme);

      // Apply theme to document
      const themeConfig = themes[newTheme];
      const root = document.documentElement;

      // Add transition class for smooth color changes
      root.classList.add('theme-transitioning');

      // Apply CSS variables with transition
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        const cssKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssKey, value);
      });

      // Apply theme class for special styling
      root.className = root.className.replace(/theme-\w+/g, '');
      root.classList.add(`theme-${newTheme}`);

      // Special handling for glass theme background
      if (newTheme === 'glass') {
        document.body.style.background = themeConfig.colors.background;
        document.body.style.minHeight = '100vh';
      } else {
        document.body.style.background = themeConfig.colors.background;
      }

      // Remove transition class after animation
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
        setIsTransitioning(false);
      }, 300);
    };

    if (theme !== localStorage.getItem('theme')) {
      applyTheme(theme);
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    if (newTheme !== theme && !isTransitioning) {
      setTheme(newTheme);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeConfig: themes[theme],
    setTheme: handleSetTheme,
    availableThemes: themes,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
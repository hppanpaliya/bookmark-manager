'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, themes, ThemeConfig } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  availableThemes: Record<Theme, ThemeConfig>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    // Apply theme to document
    const themeConfig = themes[theme];
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      const cssKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssKey, value);
    });

    // Apply theme class for special styling
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme}`);

    // Special handling for glass theme background
    if (theme === 'glass') {
      document.body.style.background = themeConfig.colors.background;
      document.body.style.minHeight = '100vh';
    } else {
      document.body.style.background = themeConfig.colors.background;
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    themeConfig: themes[theme],
    setTheme,
    availableThemes: themes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
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
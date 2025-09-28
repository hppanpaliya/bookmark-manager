export type Theme = 'light' | 'dark' | 'black' | 'glass';

export interface ThemeConfig {
  name: string;
  emoji: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardBorder: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  effects?: {
    backdrop?: string;
    cardBackdrop?: string;
    glassEffect?: boolean;
    shadows?: {
      card: string;
      hover: string;
    };
  };
}

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'Light',
    emoji: '☀️',
    colors: {
      background: '#ffffff',
      foreground: '#0f172a',
      card: '#ffffff',
      cardBorder: '#e2e8f0',
      primary: '#3b82f6',
      primaryForeground: '#f8fafc',
      secondary: '#f1f5f9',
      secondaryForeground: '#0f172a',
      muted: '#f8fafc',
      mutedForeground: '#64748b',
      accent: '#f1f5f9',
      accentForeground: '#0f172a',
      destructive: '#ef4444',
      destructiveForeground: '#f8fafc',
      border: '#e2e8f0',
      input: '#ffffff',
      ring: '#3b82f6',
    },
    effects: {
      shadows: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        hover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  dark: {
    name: 'Dark',
    emoji: '🌙',
    colors: {
      background: '#020617',
      foreground: '#f8fafc',
      card: '#0f172a',
      cardBorder: '#1e293b',
      primary: '#3b82f6',
      primaryForeground: '#f8fafc',
      secondary: '#1e293b',
      secondaryForeground: '#f8fafc',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      accent: '#1e293b',
      accentForeground: '#f8fafc',
      destructive: '#ef4444',
      destructiveForeground: '#f8fafc',
      border: '#1e293b',
      input: '#1e293b',
      ring: '#3b82f6',
    },
    effects: {
      shadows: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        hover: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
      },
    },
  },
  black: {
    name: 'Black',
    emoji: '🖤',
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      card: '#111111',
      cardBorder: '#222222',
      primary: '#ffffff',
      primaryForeground: '#000000',
      secondary: '#222222',
      secondaryForeground: '#ffffff',
      muted: '#111111',
      mutedForeground: '#888888',
      accent: '#333333',
      accentForeground: '#ffffff',
      destructive: '#ff4444',
      destructiveForeground: '#ffffff',
      border: '#333333',
      input: '#222222',
      ring: '#ffffff',
    },
    effects: {
      shadows: {
        card: '0 4px 6px -1px rgb(255 255 255 / 0.1), 0 2px 4px -2px rgb(255 255 255 / 0.05)',
        hover: '0 10px 15px -3px rgb(255 255 255 / 0.15), 0 4px 6px -4px rgb(255 255 255 / 0.1)',
      },
    },
  },
  glass: {
    name: 'Glass',
    emoji: '🔮',
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      foreground: '#ffffff',
      card: 'rgba(255, 255, 255, 0.1)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
      primary: 'rgba(255, 255, 255, 0.9)',
      primaryForeground: '#1a1a1a',
      secondary: 'rgba(255, 255, 255, 0.1)',
      secondaryForeground: '#ffffff',
      muted: 'rgba(255, 255, 255, 0.05)',
      mutedForeground: 'rgba(255, 255, 255, 0.7)',
      accent: 'rgba(255, 255, 255, 0.15)',
      accentForeground: '#ffffff',
      destructive: '#ff6b6b',
      destructiveForeground: '#ffffff',
      border: 'rgba(255, 255, 255, 0.2)',
      input: 'rgba(255, 255, 255, 0.1)',
      ring: 'rgba(255, 255, 255, 0.4)',
    },
    effects: {
      backdrop: 'blur(16px)',
      cardBackdrop: 'blur(10px)',
      glassEffect: true,
      shadows: {
        card: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        hover: '0 15px 35px 0 rgba(31, 38, 135, 0.4)',
      },
    },
  },
};

export function getThemeCSS(theme: ThemeConfig): string {
  const cssVariables = Object.entries(theme.colors)
    .map(([key, value]) => `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n    ');

  return `:root {
    ${cssVariables}
  }`;
}
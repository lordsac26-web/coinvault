import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  dark: {
    name: 'Dark',
    desc: 'Classic dark vault',
    preview: ['#0a0e1a', '#c9a84c', '#f5f0e8'],
    vars: {
      '--cv-bg': '#0a0e1a',
      '--cv-bg-card': 'rgba(255,255,255,0.02)',
      '--cv-bg-elevated': '#0f1525',
      '--cv-bg-nav': 'rgba(10,14,26,0.95)',
      '--cv-text': '#f5f0e8',
      '--cv-text-secondary': 'rgba(245,240,232,0.5)',
      '--cv-text-muted': 'rgba(245,240,232,0.35)',
      '--cv-text-faint': 'rgba(245,240,232,0.2)',
      '--cv-accent': '#e8c97a',
      '--cv-accent-dim': '#c9a84c',
      '--cv-accent-text': '#0a0e1a',
      '--cv-accent-bg': 'rgba(201,168,76,0.1)',
      '--cv-accent-border': 'rgba(201,168,76,0.15)',
      '--cv-border': 'rgba(201,168,76,0.1)',
      '--cv-border-hover': 'rgba(201,168,76,0.3)',
      '--cv-input-bg': 'rgba(255,255,255,0.05)',
      '--cv-gradient-from': 'rgba(201,168,76,0.05)',
      '--cv-gradient-to': '#0a0e1a',
      '--cv-spinner-track': 'rgba(201,168,76,0.3)',
      '--cv-spinner-head': '#e8c97a',
      '--cv-overlay': 'rgba(0,0,0,0.5)',
    },
  },
  light: {
    name: 'Light',
    desc: 'Clean & bright',
    preview: ['#faf9f6', '#8b6914', '#1a1a1a'],
    vars: {
      '--cv-bg': '#faf9f6',
      '--cv-bg-card': 'rgba(0,0,0,0.02)',
      '--cv-bg-elevated': '#ffffff',
      '--cv-bg-nav': 'rgba(250,249,246,0.97)',
      '--cv-text': '#1a1a1a',
      '--cv-text-secondary': 'rgba(26,26,26,0.6)',
      '--cv-text-muted': 'rgba(26,26,26,0.45)',
      '--cv-text-faint': 'rgba(26,26,26,0.25)',
      '--cv-accent': '#8b6914',
      '--cv-accent-dim': '#a07c1c',
      '--cv-accent-text': '#ffffff',
      '--cv-accent-bg': 'rgba(139,105,20,0.08)',
      '--cv-accent-border': 'rgba(139,105,20,0.2)',
      '--cv-border': 'rgba(0,0,0,0.1)',
      '--cv-border-hover': 'rgba(139,105,20,0.35)',
      '--cv-input-bg': 'rgba(0,0,0,0.04)',
      '--cv-gradient-from': 'rgba(139,105,20,0.05)',
      '--cv-gradient-to': '#faf9f6',
      '--cv-spinner-track': 'rgba(139,105,20,0.2)',
      '--cv-spinner-head': '#8b6914',
      '--cv-overlay': 'rgba(0,0,0,0.15)',
    },
  },
  green: {
    name: 'Patina',
    desc: 'Aged copper-green',
    preview: ['#0c1a14', '#5dba8a', '#e0ece5'],
    vars: {
      '--cv-bg': '#0c1a14',
      '--cv-bg-card': 'rgba(255,255,255,0.025)',
      '--cv-bg-elevated': '#0f2a1e',
      '--cv-bg-nav': 'rgba(12,26,20,0.95)',
      '--cv-text': '#e0ece5',
      '--cv-text-secondary': 'rgba(224,236,229,0.55)',
      '--cv-text-muted': 'rgba(224,236,229,0.38)',
      '--cv-text-faint': 'rgba(224,236,229,0.2)',
      '--cv-accent': '#5dba8a',
      '--cv-accent-dim': '#3d9e6e',
      '--cv-accent-text': '#0c1a14',
      '--cv-accent-bg': 'rgba(93,186,138,0.1)',
      '--cv-accent-border': 'rgba(93,186,138,0.18)',
      '--cv-border': 'rgba(93,186,138,0.1)',
      '--cv-border-hover': 'rgba(93,186,138,0.3)',
      '--cv-input-bg': 'rgba(255,255,255,0.05)',
      '--cv-gradient-from': 'rgba(93,186,138,0.05)',
      '--cv-gradient-to': '#0c1a14',
      '--cv-spinner-track': 'rgba(93,186,138,0.3)',
      '--cv-spinner-head': '#5dba8a',
      '--cv-overlay': 'rgba(0,0,0,0.5)',
    },
  },
  goldsilver: {
    name: 'Gold & Silver',
    desc: 'Two-tone metallic',
    preview: ['#121218', '#d4af37', '#c0c0c0'],
    vars: {
      '--cv-bg': '#121218',
      '--cv-bg-card': 'rgba(255,255,255,0.025)',
      '--cv-bg-elevated': '#1a1a24',
      '--cv-bg-nav': 'rgba(18,18,24,0.95)',
      '--cv-text': '#e8e4dd',
      '--cv-text-secondary': 'rgba(232,228,221,0.55)',
      '--cv-text-muted': 'rgba(232,228,221,0.38)',
      '--cv-text-faint': 'rgba(232,228,221,0.2)',
      '--cv-accent': '#d4af37',
      '--cv-accent-dim': '#c0a030',
      '--cv-accent-text': '#121218',
      '--cv-accent-bg': 'rgba(212,175,55,0.1)',
      '--cv-accent-border': 'rgba(212,175,55,0.18)',
      '--cv-border': 'rgba(192,192,192,0.12)',
      '--cv-border-hover': 'rgba(212,175,55,0.35)',
      '--cv-input-bg': 'rgba(255,255,255,0.05)',
      '--cv-gradient-from': 'rgba(192,192,192,0.05)',
      '--cv-gradient-to': '#121218',
      '--cv-spinner-track': 'rgba(212,175,55,0.3)',
      '--cv-spinner-head': '#d4af37',
      '--cv-overlay': 'rgba(0,0,0,0.5)',
    },
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('cvTheme') || 'dark');

  useEffect(() => {
    const theme = THEMES[themeKey] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val));
    localStorage.setItem('cvTheme', themeKey);
  }, [themeKey]);

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme: setThemeKey, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
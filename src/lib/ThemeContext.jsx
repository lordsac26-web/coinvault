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
      '--cv-accent-dim': '#b8942e',
      '--cv-accent-text': '#ffffff',
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
    preview: ['#142a20', '#6dd49e', '#e8f2ec'],
    vars: {
      '--cv-bg': '#142a20',
      '--cv-bg-card': 'rgba(255,255,255,0.04)',
      '--cv-bg-elevated': '#1a3a2a',
      '--cv-bg-nav': 'rgba(20,42,32,0.95)',
      '--cv-text': '#e8f2ec',
      '--cv-text-secondary': 'rgba(232,242,236,0.65)',
      '--cv-text-muted': 'rgba(232,242,236,0.48)',
      '--cv-text-faint': 'rgba(232,242,236,0.28)',
      '--cv-accent': '#6dd49e',
      '--cv-accent-dim': '#3aaa6e',
      '--cv-accent-text': '#ffffff',
      '--cv-accent-bg': 'rgba(109,212,158,0.12)',
      '--cv-accent-border': 'rgba(109,212,158,0.22)',
      '--cv-border': 'rgba(109,212,158,0.14)',
      '--cv-border-hover': 'rgba(109,212,158,0.35)',
      '--cv-input-bg': 'rgba(255,255,255,0.07)',
      '--cv-gradient-from': 'rgba(109,212,158,0.06)',
      '--cv-gradient-to': '#142a20',
      '--cv-spinner-track': 'rgba(109,212,158,0.3)',
      '--cv-spinner-head': '#6dd49e',
      '--cv-overlay': 'rgba(0,0,0,0.45)',
    },
  },
  goldsilver: {
    name: 'Gold & Silver',
    desc: 'Two-tone metallic',
    preview: ['#1a1a24', '#e0c050', '#d0d0d0'],
    vars: {
      '--cv-bg': '#1a1a24',
      '--cv-bg-card': 'rgba(255,255,255,0.04)',
      '--cv-bg-elevated': '#242430',
      '--cv-bg-nav': 'rgba(26,26,36,0.95)',
      '--cv-text': '#f0ece5',
      '--cv-text-secondary': 'rgba(240,236,229,0.65)',
      '--cv-text-muted': 'rgba(240,236,229,0.48)',
      '--cv-text-faint': 'rgba(240,236,229,0.28)',
      '--cv-accent': '#e0c050',
      '--cv-accent-dim': '#b89828',
      '--cv-accent-text': '#ffffff',
      '--cv-accent-bg': 'rgba(224,192,80,0.12)',
      '--cv-accent-border': 'rgba(224,192,80,0.22)',
      '--cv-border': 'rgba(208,208,208,0.16)',
      '--cv-border-hover': 'rgba(224,192,80,0.4)',
      '--cv-input-bg': 'rgba(255,255,255,0.07)',
      '--cv-gradient-from': 'rgba(208,208,208,0.06)',
      '--cv-gradient-to': '#1a1a24',
      '--cv-spinner-track': 'rgba(224,192,80,0.3)',
      '--cv-spinner-head': '#e0c050',
      '--cv-overlay': 'rgba(0,0,0,0.45)',
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
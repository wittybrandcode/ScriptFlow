import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Default to clean studio light theme unless explicitly chosen by user
    const savedTheme = localStorage.getItem('scriptflow-theme-v2') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Clean up any stale forced dark mode from previous sessions
    try {
      localStorage.removeItem('scriptflow-theme');
      localStorage.setItem('scriptflow-theme-v2', 'light');
    } catch {
      // Ignore storage errors in non-browser environments
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('scriptflow-theme-v2', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}

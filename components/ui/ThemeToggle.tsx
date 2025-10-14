'use client';

import { useEffect, useState, type FC } from 'react';

const ThemeToggle: FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
    setTheme(current);
  }, []);

  function toggle() {
    const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
  }

  if (!theme) return null;

  return (
    <button
      className="icon-btn"
      onClick={toggle}
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;

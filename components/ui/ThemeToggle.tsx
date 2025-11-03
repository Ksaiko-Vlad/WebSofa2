'use client';

import { useEffect, useState, type FC } from 'react';
import s from './Header.module.css'

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
    }
  }

  if (!theme) return null;

  return (
    <button
      className={s.iconBtn}
      onClick={toggle}
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;

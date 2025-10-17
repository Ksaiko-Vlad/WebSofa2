'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle'
import type { FC } from 'react';

interface HeaderProps {
  session?: Record<string, any> | null;
}

const CartIcon: FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10
         0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0
         1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.99 5H6.21l-.94-2H2a1 1 0 1 0 0 2h1.61l3.44
         7.59-1.28 2.34A2 2 0 0 0 7.16 18H20a1 1 0 1 0 0-2H7.16l1-2z"
      fill="currentColor"
    />
  </svg>
);

const Header: FC<HeaderProps> = ({ session }) => {
  const router = useRouter();

  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.replace('/');
    router.refresh();
  }

  const isAuthed = !!session;

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          Timber&Grain
        </Link>

        <nav className="nav">
          <Link href="/products">Каталог</Link>
          <Link href="/about">О нас</Link>
          {isAuthed && <Link href="/account">Кабинет</Link>}
        </nav>

        <div className="actions">
          <Link href="/cart" className="icon-btn" aria-label="Корзина">
            <CartIcon />
          </Link>

          {isAuthed ? (
            <button className="btn btn-outline" onClick={logout}>
              Выйти
            </button>
          ) : (
            <Link href="/login" className="btn btn-outline">
              Войти
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;

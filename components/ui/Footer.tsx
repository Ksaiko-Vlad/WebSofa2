import type { FC } from 'react';
import Link from 'next/link'; 

const Footer: FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-col">
          <div className="brand">Timber&Grain</div>
          <div className="muted">© {year} Timber&Grain</div>
        </div>

        <div className="footer-col">
          <div className="footer-title">Контакты</div>
          <div className="muted">+375 (29) 180-95-30</div>
          <div className="muted">timberandgrain@gmail.com</div>
        </div>

        <div className="footer-col">
          <div className="footer-title">Навигация</div>
          <nav className="footer-links">
            <Link href="/products">Каталог</Link>
            <Link href="/login">Войти</Link>
            <Link href="/contacts">О нас</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

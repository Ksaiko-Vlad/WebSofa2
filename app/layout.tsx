import './globals.css';
import type { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { CartProvider } from '@/components/cart/CartProvider'

export const metadata: Metadata = {
  title: 'WebSofa',
  description: 'Каталог мебели',
};

const themeInit = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.dataset.theme = t;
    } else {
      var m = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.dataset.theme = m.matches ? 'dark' : 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <CartProvider>{children}</CartProvider>
    </html>
  );
}

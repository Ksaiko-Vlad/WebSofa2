import Header from '@/components/HeaderServer';
import Footer from '@/components/ui/Footer';
import { ToastProvider } from '@/hooks/useToast';
import type { PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <body className="site">
      <ToastProvider>
      <Header />
      <main className="container">{children}</main>
      <Footer />
      </ToastProvider>
    </body>
  );
}

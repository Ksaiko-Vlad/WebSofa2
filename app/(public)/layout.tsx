import Header from '@/components/HeaderServer';
import Footer from '@/components/ui/Footer';
import { ToastProvider } from '@/hooks/useToast';
import type { PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
    <div className="site">
      <Header />
      <main className="container">{children}</main>
      <Footer />
    </div>
    </ToastProvider>
  );
}

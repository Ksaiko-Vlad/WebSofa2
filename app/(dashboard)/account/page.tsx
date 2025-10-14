import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Личный кабинет — WebSofa',
  robots: { index: false, follow: false },
  alternates: { canonical: '/account' },
};

export default function AccountPage() {
  return (
    <section className="container" style={{ padding: '24px 0' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Личный кабинет
      </h1>
      <p className="muted">Здесь позже появятся ваши заказы и профиль.</p>
    </section>
  );
}

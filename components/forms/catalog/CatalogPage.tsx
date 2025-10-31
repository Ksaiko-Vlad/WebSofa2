'use client';

import { useEffect, useState } from 'react';
import type { ProductDto } from '@/types/product';
import ProductCard from './ProductCard';
import s from './CatalogPage.module.css';

export default function CatalogPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/v1/products', {
          cache: 'no-store',
          next: { revalidate: 0 },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ProductDto[];
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e.name !== 'AbortError') setErr(e?.message ?? 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  if (loading) return <p className={s.muted}>Загрузка каталога…</p>;
  if (err) return <p className={s.muted}>Не удалось загрузить товары: {err}</p>;
  if (products.length === 0) return <p className={s.muted}>Пока нет товаров</p>;

  return (
    <section className={s.wrapper}>
      <h2 className={s.title}>Каталог товаров</h2>
      <div className={s.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

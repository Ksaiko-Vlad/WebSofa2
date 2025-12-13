"use client";

import { useEffect, useState } from "react";
import s from "./ManagerStock.module.css";

type Material = { name: string | null } | null;
type Product = { name: string | null } | null;

type ProductVariant = {
  id: number | string;
  sku: string | null;
  price: number | string | null;
  product?: Product;
  material?: Material;
} | null;

type StockRow = {
  product_variant_id: number | string;
  quantity: number;
  productVariant: ProductVariant;
};

type Shop = {
  id: number | string;
  city: string;
  street: string;
} | null;

type ApiResponse = {
  shop: Shop;
  stock: StockRow[];
  message?: string;
};

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  return n.toFixed(2);
}

export default function ManagerStockPage() {
  const [shop, setShop] = useState<Shop>(null);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        const res = await fetch("/api/v1/manager/stock", { credentials: "include" });
        const json: ApiResponse = await res.json();

        if (!res.ok) {
          throw new Error((json as any)?.message || "Ошибка загрузки остатков");
        }

        if (!cancelled) {
          setShop(json.shop ?? null);
          setStock(Array.isArray(json.stock) ? json.stock : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Ошибка загрузки остатков");
          setShop(null);
          setStock([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className={s.wrapper}>
        <p className={s.muted}>Загрузка остатков…</p>
      </section>
    );
  }

  if (err) {
    return (
      <section className={s.wrapper}>
        <p className={s.error}>{err}</p>
      </section>
    );
  }

  if (!shop) {
    return (
      <section className={s.wrapper}>
        <h2 className={s.title}>Остатки в магазине</h2>
        <p className={s.muted}>За вами не закреплён ни один магазин.</p>
      </section>
    );
  }

  return (
    <section className={s.wrapper}>
      <h2 className={s.title}>Остатки в магазине</h2>

      <div className={s.shopInfo}>
        <span className={s.shopLabel}>Магазин:</span>
        <span className={s.shopValue}>
          #{String(shop.id)} • {shop.city}, {shop.street}
        </span>
      </div>

      {stock.length === 0 ? (
        <p className={s.muted}>В этом магазине пока нет позиций на складе.</p>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID варианта</th>
              <th>Товар</th>
              <th>Материал</th>
              <th>SKU</th>
              <th>Цена, BYN</th>
              <th>Остаток</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => {
              const pv = row.productVariant;
              const productName = pv?.product?.name ?? "—";
              const materialName = pv?.material?.name ?? "—";
              const sku = pv?.sku ?? "—";
              const price = pv?.price;

              return (
                <tr key={String(row.product_variant_id)}>
                  <td>{String(row.product_variant_id)}</td>
                  <td>{productName}</td>
                  <td>{materialName}</td>
                  <td>{sku}</td>
                  <td>{money(price)}</td>
                  <td>
                    <span
                      className={
                        row.quantity > 0 ? s.qtyOk : s.qtyZero
                      }
                    >
                      {row.quantity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

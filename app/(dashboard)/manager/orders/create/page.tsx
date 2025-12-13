"use client";

import { useEffect, useMemo, useState } from "react";
import s from "./ManagerOrdersCreate.module.css";

type ProductVariant = {
  id: number;
  price: number;
  sku: string;
  active: boolean;
  material: { name: string; price_per_mm3: number };
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number;
  image_path: string | null;
  active: boolean;
  variants: ProductVariant[];
};

type DeliveryType = "pickup" | "home_delivery";

type FormState = {
  name: string;
  second_name: string;
  last_name: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  shopId: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  note: string;
};

const initialForm: FormState = {
  name: "",
  second_name: "",
  last_name: "",
  phone: "",
  email: "",
  deliveryType: "pickup",
  shopId: "",
  city: "",
  street: "",
  house: "",
  apartment: "",
  entrance: "",
  floor: "",
  note: "",
};

type Shop = { id: number; city: string; street: string };

type DraftItem = {
  product_variant_id: number;
  title: string;
  unit_price: number;
  quantity: number;
  is_from_shop_stock: boolean; // ✅ новое поле
};

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeProducts(raw: any): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p: any) => {
    const baseVariant: ProductVariant = {
      id: toNum(p.id),
      price: toNum(p.base_price ?? p.price ?? 0),
      sku: String(p.sku ?? `SKU-${p.id}`),
      active: true,
      material: { name: "Базовый", price_per_mm3: 0 },
    };

    const variants =
      Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants.map((v: any) => ({
            id: toNum(v.id),
            price: toNum(v.price ?? p.base_price ?? 0),
            sku: String(v.sku ?? ""),
            active: Boolean(v.active ?? true),
            material: {
              name: String(v.material?.name ?? "Материал"),
              price_per_mm3: toNum(v.material?.price_per_mm3),
            },
          }))
        : [baseVariant];

    return {
      id: toNum(p.id),
      name: String(p.name ?? ""),
      description: p.description ?? null,
      category: p.category ?? null,
      base_price: toNum(p.base_price ?? 0),
      image_path: p.image_path ?? null,
      active: true,
      variants,
    };
  });
}

function normalizeShops(raw: any): Shop[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((sh: any) => ({
    id: toNum(sh.id),
    city: String(sh.city ?? ""),
    street: String(sh.street ?? ""),
  }));
}

export default function ManagerNewOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | "">("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [prods, shopsData] = await Promise.all([
          fetch("/api/v1/products").then((r) => r.json()),
          fetch("/api/v1/shops").then((r) => r.json()).catch(() => []),
        ]);
        setProducts(normalizeProducts(prods));
        setShops(normalizeShops(shopsData));
      } catch (e) {
        console.error(e);
        setProducts([]);
      }
    })();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const variants = useMemo(() => selectedProduct?.variants || [], [selectedProduct]);

  const hasFromStock = useMemo(
    () => items.some((i) => i.is_from_shop_stock),
    [items]
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function addSelectedVariant() {
    if (!selectedVariantId || !selectedProduct) return;
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    // дефолт: для самовывоза — чаще "со склада", для доставки — чаще "под заказ"
    const defaultFromStock = form.deliveryType === "pickup";

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_variant_id === variant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product_variant_id: variant.id,
          title: `${selectedProduct.name} • ${variant.material.name} • ${variant.sku}`,
          unit_price: variant.price,
          quantity: 1,
          is_from_shop_stock: defaultFromStock, // ✅ новое
        },
      ];
    });

    setSelectedVariantId("");
  }

  function setQty(variantId: number, quantity: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.product_variant_id === variantId
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    );
  }

  function toggleFromStock(variantId: number, next: boolean) {
    setItems((prev) =>
      prev.map((i) =>
        i.product_variant_id === variantId
          ? { ...i, is_from_shop_stock: next }
          : i
      )
    );
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.product_variant_id !== id));
  }

  const totalUi = useMemo(
    () => items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
    [items]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!items.length) {
      setMsg("❌ Добавь хотя бы один товар");
      return;
    }

    // ✅ если хоть одна позиция со склада — магазин обязателен
    if (items.some((i) => i.is_from_shop_stock) && !form.shopId) {
      setMsg("❌ Для позиций 'со склада' нужно выбрать магазин");
      return;
    }

    if (form.deliveryType === "pickup" && !form.shopId) {
      setMsg("❌ Для самовывоза нужно выбрать магазин");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/manager/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            second_name: form.second_name || undefined,
            last_name: form.last_name || undefined,
            phone: form.phone,
            email: form.email || undefined,
          },
          delivery: {
            type: form.deliveryType,
            shopId:
              form.shopId
                ? Number(form.shopId)
                : null,
            address:
              form.deliveryType === "home_delivery"
                ? {
                    city: form.city,
                    street: form.street,
                    house: form.house,
                    apartment: form.apartment || null,
                    entrance: form.entrance || null,
                    floor: form.floor || null,
                  }
                : null,
          },
          note: form.note || null,
          items: items.map((i) => ({
            product_variant_id: i.product_variant_id,
            quantity: i.quantity,
            is_from_shop_stock: i.is_from_shop_stock, // ✅ отправляем
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Ошибка");

      setMsg("✅ Заказ создан");
      setForm(initialForm);
      setItems([]);
      setSelectedProductId("");
      setSelectedVariantId("");
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={s.wrapper}>
      <h2 className={s.title}>Новый офлайн-заказ</h2>

      <form className={s.form} onSubmit={submit}>
        <h3 className={s.h3}>Клиент</h3>
        <div className={s.row}>
          <input name="name" placeholder="Имя" value={form.name} onChange={handleChange} required />
          <input name="second_name" placeholder="Отчество" value={form.second_name} onChange={handleChange} />
          <input name="last_name" placeholder="Фамилия" value={form.last_name} onChange={handleChange} />
        </div>
        <div className={s.row}>
          <input name="phone" placeholder="Телефон" value={form.phone} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        </div>

        <h3 className={s.h3}>Доставка</h3>
        <div className={s.row}>
          <select name="deliveryType" value={form.deliveryType} onChange={handleChange}>
            <option value="pickup">Самовывоз</option>
            <option value="home_delivery">Доставка</option>
          </select>

          {/*  показываем выбор магазина:
              - всегда при самовывозе
              - или если есть/будут позиции "со склада" */}
          {(form.deliveryType === "pickup" || hasFromStock) && (
            <select name="shopId" value={form.shopId} onChange={handleChange}>
              <option value="">Выберите магазин</option>
              {shops.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.city}, {sh.street}
                </option>
              ))}
            </select>
          )}
        </div>

        {form.deliveryType === "home_delivery" && (
          <>
            <div className={s.row}>
              <input name="city" placeholder="Город" value={form.city} onChange={handleChange} />
              <input name="street" placeholder="Улица" value={form.street} onChange={handleChange} />
            </div>
            <div className={s.row}>
              <input name="house" placeholder="Дом" value={form.house} onChange={handleChange} />
              <input name="apartment" placeholder="Квартира" value={form.apartment} onChange={handleChange} />
            </div>
          </>
        )}

        <h3 className={s.h3}>Товары</h3>
        <div className={s.row}>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setSelectedProductId(val);
              setSelectedVariantId("");
            }}
          >
            <option value="">Выберите товар</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            disabled={!selectedProduct}
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(Number(e.target.value) || "")}
          >
            <option value="">Выберите вариант</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.material.name} • {v.sku} • {v.price} BYN
              </option>
            ))}
          </select>

          <button type="button" className={s.secondary} onClick={addSelectedVariant}>
            Добавить
          </button>
        </div>

        {items.length > 0 && (
          <div className={s.items}>
            {items.map((i) => (
              <div key={i.product_variant_id} className={s.itemRow}>
                <div className={s.itemTitle}>{i.title}</div>

                <div className={s.itemRight}>
                  <div className={s.price}>{i.unit_price.toFixed(2)} BYN</div>

                  {/*  Со склада */}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 10 }}>
                    <input
                      type="checkbox"
                      checked={i.is_from_shop_stock}
                      onChange={(e) => toggleFromStock(i.product_variant_id, e.target.checked)}
                    />
                    <span style={{ fontSize: 12, opacity: 0.8 }}>С магазина</span>
                  </label>

                  <input
                    className={s.qty}
                    type="number"
                    value={i.quantity}
                    min={1}
                    onChange={(e) => setQty(i.product_variant_id, Number(e.target.value))}
                  />

                  <button
                    type="button"
                    className={s.remove}
                    onClick={() => removeItem(i.product_variant_id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className={s.total}>Итого: {totalUi.toFixed(2)} BYN</div>

            {items.some((x) => x.is_from_shop_stock) && !form.shopId && (
              <p className={s.message} style={{ color: "crimson" }}>
                ❗ Для позиций «с магазина» выбери магазин
              </p>
            )}
          </div>
        )}

        <button className={s.primary} type="submit" disabled={loading}>
          {loading ? "Создаём…" : "Создать заказ"}
        </button>

        {msg && <p className={s.message}>{msg}</p>}
      </form>
    </section>
  );
}

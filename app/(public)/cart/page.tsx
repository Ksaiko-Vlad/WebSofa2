
'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import s from './CartPage.module.css'

export default function CartPage() {
  const { items, totalPrice, setQuantity, removeItem, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  if (items.length === 0) {
    return (
      <section className={s.wrapper}>
        <h2 className={s.title}>Корзина</h2>
        <p className={s.muted}>Корзина пуста</p>
      </section>
    )
  }

  async function handleCheckout() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data?.message || 'Не удалось создать платеж')
      }

      // редиректим на Stripe Checkout
      window.location.href = data.url
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={s.wrapper}>
      <h2 className={s.title}>Корзина</h2>

      <div className={s.list}>
        {items.map((item) => (
          <div key={item.sku} className={s.row}>
            {item.image_path && (
              <div className={s.thumb}>
                <img src={item.image_path} alt={item.name} />
              </div>
            )}

            <div className={s.info}>
              <div className={s.name}>{item.name}</div>
              <div className={s.material}>{item.materialName}</div>
            </div>

            <div className={s.priceCell}>
              {item.price.toLocaleString('ru-RU')} BYN
            </div>

            <div className={s.qtyCell}>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  setQuantity(item.sku, Number(e.target.value) || 1)
                }
              />
            </div>

            <div className={s.totalCell}>
              {(item.price * item.quantity).toLocaleString('ru-RU')} BYN
            </div>

            <button
              className={s.removeBtn}
              onClick={() => removeItem(item.sku)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className={s.summary}>
        <span>Итого:</span>
        <span>{totalPrice.toLocaleString('ru-RU')} BYN</span>
      </div>

      <div className={s.actions}>
        <button className={s.secondary} onClick={clear}>
          Очистить корзину
        </button>
        <button className={s.primary} onClick={handleCheckout} disabled={loading}>
        {loading ? 'Переходим к оплате…' : 'Оформить заказ'}
        </button>
      </div>
    </section>
  )
}

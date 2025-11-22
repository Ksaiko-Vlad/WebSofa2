// app/(public)/cart/page.tsx
'use client'

import { useCart } from '@/components/cart/CartProvider'
import s from './CartPage.module.css'

export default function CartPage() {
  const { items, totalPrice, setQuantity, removeItem, clear } = useCart()

  if (items.length === 0) {
    return (
      <section className={s.wrapper}>
        <h2 className={s.title}>Корзина</h2>
        <p className={s.muted}>Корзина пуста</p>
      </section>
    )
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
        <button className={s.primary}>Оформить заказ</button>
      </div>
    </section>
  )
}

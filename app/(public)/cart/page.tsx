// app/(public)/cart/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import s from './CartPage.module.css'

type Shop = {
  id: number
  city: string
  street: string
}

type DeliveryType = 'pickup' | 'home_delivery'

type CheckoutFormState = {
  name: string
  second_name: string,
  last_name: string,
  phone: string
  email: string
  deliveryType: DeliveryType
  shopId: string // как строка из <select>
  city: string
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  note: string
}

const initialForm: CheckoutFormState = {
  name: '',
  second_name: '',
  last_name: '',
  phone: '',
  email: '',
  deliveryType: 'pickup',
  shopId: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  entrance: '',
  floor: '',
  note: '',
}

export default function CartPage() {
  const { items, totalPrice, setQuantity, removeItem, clear } = useCart()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [shops, setShops] = useState<Shop[]>([])
  const [form, setForm] = useState<CheckoutFormState>(initialForm)

  // грузим магазины для самовывоза (хуки — всегда выше любых return!)
  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch('/api/v1/shops')
        if (!res.ok) return
        const data = (await res.json()) as Shop[]
        setShops(Array.isArray(data) ? data : [])
      } catch (e) {
        console.warn('shops load error', e)
      }
    }
    loadShops()
  }, [])

  // если корзина пустая
  if (items.length === 0) {
    return (
      <section className={s.wrapper}>
        <h2 className={s.title}>Корзина</h2>
        <p className={s.muted}>Корзина пуста</p>
      </section>
    )
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/v1/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name,
            second_name: form.second_name,
            last_name: form.last_name,
            phone: form.phone,
            email: form.email,
          },
          delivery: {
            type: form.deliveryType,
            shopId:
              form.deliveryType === 'pickup' && form.shopId
                ? Number(form.shopId)
                : null,
            address:
              form.deliveryType === 'home_delivery'
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
          items, // из CartProvider
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data?.message || 'Не удалось создать заказ / платеж')
      }

      // редирект на Stripe Checkout
      window.location.href = data.url
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Ошибка оформления заказа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={s.wrapper}>
      <h2 className={s.title}>Корзина</h2>

      {/* Список товаров */}
      <div className={s.list}>
        {items.map(item => (
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
                onChange={e =>
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

      {/* Итог по корзине */}
      <div className={s.summary}>
        <span>Итого:</span>
        <span>{totalPrice.toLocaleString('ru-RU')} BYN</span>
      </div>

      {/* Кнопки под корзиной */}
      <div className={s.actions}>
        <button className={s.secondary} onClick={clear}>
          Очистить корзину
        </button>

        <button
          className={s.primary}
          onClick={() => setIsFormOpen(prev => !prev)}
        >
          {isFormOpen ? 'Скрыть форму' : 'Оформить заказ'}
        </button>
      </div>

      {/* Форма оформления заказа — «всплывает» под корзиной */}
      {isFormOpen && (
        <form className={s.checkoutForm} onSubmit={handleSubmitOrder}>
          <h3 className={s.subtitle}>Контактные данные</h3>

          <div className={s.formRow}>
            <input
              name="name"
              placeholder="Имя"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="second_name"
              placeholder="Отчество"
              value={form.second_name}
              onChange={handleChange}
            />
            <input
              name="last_name"
              placeholder="Фамилия"
              value={form.last_name}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Телефон"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <h3 className={s.subtitle}>Доставка</h3>

          <div className={s.formRow}>
            <label>
              Тип доставки
              <select
                name="deliveryType"
                value={form.deliveryType}
                onChange={handleChange}
              >
                <option value="pickup">Самовывоз</option>
                <option value="home_delivery">Доставка</option>
              </select>
            </label>
          </div>

          {/* Самовывоз — выбор магазина */}
          {form.deliveryType === 'pickup' && (
            <div className={s.formRow}>
              <label>
                Магазин самовывоза
                <select
                  name="shopId"
                  value={form.shopId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите магазин</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.city}, {shop.street}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Курьер — адрес доставки */}
          {form.deliveryType === 'home_delivery' && (
            <>
              <div className={s.formRow}>
                <input
                  name="city"
                  placeholder="Город"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
                <input
                  name="street"
                  placeholder="Улица"
                  value={form.street}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={s.formRow}>
                <input
                  name="house"
                  placeholder="Дом"
                  value={form.house}
                  onChange={handleChange}
                  required
                />
                <input
                  name="apartment"
                  placeholder="Квартира"
                  value={form.apartment}
                  onChange={handleChange}
                />
              </div>

              <div className={s.formRow}>
                <input
                  name="entrance"
                  placeholder="Подъезд"
                  value={form.entrance}
                  onChange={handleChange}
                />
                <input
                  name="floor"
                  placeholder="Этаж"
                  value={form.floor}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <textarea
            name="note"
            placeholder="Комментарий к заказу (необязательно)"
            value={form.note}
            onChange={handleChange}
            rows={3}
          />

          {error && <p className={s.error}>{error}</p>}

          <div className={s.checkoutFooter}>
            <div>
              <span>Итого к оплате: </span>
              <strong>{totalPrice.toLocaleString('ru-RU')} BYN</strong>
            </div>

            <button type="submit" className={s.primary} disabled={loading}>
              {loading ? 'Переходим к оплате…' : 'Перейти к оплате'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

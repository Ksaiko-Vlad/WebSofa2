'use client'

import s from './UserOrders.module.css'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/useToast'

interface Order {
  id: number | string
  created_at: string
  total: number
  status: string
}

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { show } = useToast()
  const didFetch = useRef(false)

  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    async function fetchOrders() {
      try {
        const res = await fetch('/api/v1/orders/my')
        if (!res.ok) throw new Error('Ошибка загрузки заказов')
        const data = await res.json()
        setOrders(data.orders ?? [])
      } catch (err) {
        show({
          title: 'Ошибка',
          description: err instanceof Error ? err.message : 'Не удалось получить заказы',
          duration: 6000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [show])

  if (loading)
    return (
      <div className={s.card}>
        <h2 className={s.subtitle}>Мои заказы</h2>
        <p className={s.muted}>Загружаем ваши заказы...</p>
      </div>
    )

  return (
    <div className={s.card}>
      <h2 className={s.subtitle}>Мои заказы</h2>

      {orders.length === 0 ? (
        <div className={s.ordersPlaceholder}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={s.icon}
          >
            <path d="M21 16V8a2 2 0 0 0-2-2h-4l-2-2h-4L7 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <p>Вы ещё не сделали ни одного заказа.</p>
        </div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.total.toFixed(2)} BYN</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

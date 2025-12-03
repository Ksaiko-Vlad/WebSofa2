'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'
import s from './AdminProductList.module.css'
import type { Product } from '@/types/product'
import EditProductModal from './EditProductModal'

export default function AdminProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const { show } = useToast()

  const loadProducts = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/v1/admin/products', { cache: 'no-store' })
      if (!res.ok) throw new Error('Ошибка при загрузке товаров')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
      show({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        duration: 6000,
      })
    } finally {
      setLoading(false)
      // добавляем небольшую задержку для плавности
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }, [show])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  if (loading) {
    return (
      <div className={s.wrapper}>
        <div className={s.card}>
          <p className={s.muted}>Загрузка товаров...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <div className={s.headerRow}>
          <h2 className={s.title}>Все товары</h2>
          {isRefreshing && (
            <span className={s.refreshBadge}>Обновляем...</span>
          )}
        </div>

        {products.length === 0 ? (
          <div className={s.ordersPlaceholder}>
            <p>Товаров пока нет</p>
          </div>
        ) : (
          <div className={`${s.tableWrapper} ${isRefreshing ? s.tableFading : ''}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Размеры (мм)</th>
                  <th>Материалы</th>
                  <th>Цены</th>
                  <th>Активность варианта</th>
                  <th>Активность товара</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td className={s.nameCell}>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.width_mm}×{p.height_mm}×{p.depth_mm}</td>

                    {/* Материалы */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>Нет вариаций</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map((v) => (
                            <li key={v.id}>{v.material.name}</li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Цены */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>—</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map((v) => (
                            <li key={v.id}>
                              {Number(v.price).toFixed(2)} BYN
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Активность вариантов */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>—</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map((v) => (
                            <li key={v.id}>
                              <span
                                className={
                                  v.active ? s.badgeActive : s.badgeInactive
                                }
                              >
                                {v.active ? 'Активен' : 'Выключен'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Активность товара */}
                    <td>
                      <span
                        className={p.active ? s.badgeActive : s.badgeInactive}
                      >
                        {p.active ? 'Активен' : 'Выключен'}
                      </span>
                    </td>

                    {/* Кнопка редактирования */}
                    <td>
                      <button
                        className={s.editBtn}
                        onClick={() => setSelected(p)}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка */}
      {selected && (
        <EditProductModal
          open={!!selected}
          product={selected}
          onClose={() => {
            setSelected(null)
            loadProducts() 
          }}
          onUpdated={() => {
            loadProducts() 
          }}
        />
      )}
    </div>
  )
}

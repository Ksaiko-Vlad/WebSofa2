'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import s from './AdminProductList.module.css'

interface ProductVariant {
  id: number
  price: number | string
  sku: string
  active: boolean
  material: {
    name: string
    price_per_mm3: number
  }
}

interface Product {
  id: number
  name: string
  description: string
  category: string
  width_mm: number
  height_mm: number
  depth_mm: number
  active: boolean
  variants: ProductVariant[]
}

export default function AdminProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { show } = useToast()

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/v1/admin/products')
        if (!res.ok) throw new Error('Ошибка при загрузке товаров')
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error(err)
        show({ title: 'Ошибка', description: 'Не удалось загрузить товары', duration: 6000 })
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [show])

  if (loading) return <p className={s.muted}>Загрузка товаров...</p>

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <h2 className={s.title}>Все товары</h2>

        {products.length === 0 ? (
          <div className={s.ordersPlaceholder}>
            <p>Товаров пока нет</p>
          </div>
        ) : (
          <div className={s.tableWrapper}>
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
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td className={s.nameCell}>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.width_mm}×{p.height_mm}×{p.depth_mm}</td>

                    {/* Материалы (столбец) */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>Нет вариаций</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map(v => (
                            <li key={v.id} className={s.colItem}>
                              <span className={s.materialName}>{v.material.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Цены (столбец) */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>—</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map(v => (
                            <li key={v.id} className={s.colItem}>
                              <span className={s.materialPrice}>
                                {Number(v.price).toFixed(2)} BYN
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Активность варианта (столбец) */}
                    <td>
                      {p.variants.length === 0 ? (
                        <span className={s.muted}>—</span>
                      ) : (
                        <ul className={s.colList}>
                          {p.variants.map(v => (
                            <li key={v.id} className={s.colItem}>
                              <span className={v.active ? s.badgeActive : s.badgeInactive}>
                                {v.active ? 'Активен' : 'Выключен'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    {/* Активность товара */}
                    <td>
                      <span className={p.active ? s.badgeActive : s.badgeInactive}>
                        {p.active ? 'Активен' : 'Выключен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

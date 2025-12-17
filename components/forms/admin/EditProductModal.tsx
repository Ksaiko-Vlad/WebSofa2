'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import s from './EditProductModal.module.css'
import { useToast } from '@/hooks/useToast'
import type { Product } from '@/types/product'
type Category = import('@prisma/client').ProductCategory

type Props = {
  product: Product
  open: boolean
  onClose: () => void
  onUpdated?: (p: Product) => void
}

export default function EditProductModal({ product, open, onClose, onUpdated }: Props) {
  const { show } = useToast()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description)
  const [basePrice, setBasePrice] = useState<number>(Number(product.base_price ?? 0))
  const [active, setActive] = useState<boolean>(product.active)
  const [category, setCategory] = useState<Category>(product.category as Category)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(
    (product as any).image_path ? String((product as any).image_path) : null
  )
  const [variants, setVariants] = useState(product.variants)

  useEffect(() => {
    if (open) console.log('🔍 product:', product)
  }, [open, product])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setName(product.name)
    setDescription(product.description)
    setBasePrice(Number(product.base_price ?? 0))
    setActive(product.active)
    setCategory(product.category as Category)
    setImageFile(null)
    setImageUrl((product as any).image_path ? String((product as any).image_path) : null)
    setVariants(product.variants)
  }, [open, product])

  // --- превью изображения ---
  const preview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    if (imageUrl) return imageUrl
    return null
  }, [imageFile, imageUrl])

  useEffect(() => {
    return () => {
      if (imageFile && preview) URL.revokeObjectURL(preview)
    }
  }, [imageFile, preview])

  if (!open) return null

  async function save() {
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      fd.append('base_price', String(basePrice))
      fd.append('active', String(active))
      fd.append('category', category)
      fd.append('variants', JSON.stringify(variants.map(v => ({ id: v.id, active: v.active }))))
      if (imageFile) fd.append('image', imageFile)

      const r = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        body: fd,
        cache: 'no-store',
      })

      const data = await r.json()
      if (!r.ok) throw new Error(data?.message || 'Не удалось обновить товар')

      show({ title: 'Сохранено', description: 'Товар обновлён', duration: 4000 })
      onUpdated?.(data.product)
      onClose()
    } catch (e) {
      show({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Неизвестная ошибка',
        duration: 6000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className={s.overlay}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={s.modal} role="dialog" aria-modal="true">
        <div className={s.header}>
          <h3 className={s.title}>Редактировать товар #{product.id}</h3>
          <button className={s.close} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className={s.grid}>
          {/* Левая колонка */}
          <div className={s.section}>
            <div className={s.field}>
              <span className={s.label}>Название</span>
              <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className={s.field}>
              <span className={s.label}>Описание</span>
              <textarea className={s.textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className={s.field}>
              <span className={s.label}>Базовая цена (BYN)</span>
              <input
                className={s.input}
                type="number"
                min={0}
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
            </div>

            <label className={s.field}>
              <span className={s.label}>Категория</span>
              <select className={s.input} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                <option value="CHAIR">Стул</option>
                <option value="TABLE">Стол</option>
                <option value="BED">Кровать</option>
                <option value="SOFA">Диван</option>
                <option value="PUFF">Пуффик</option>
                <option value="ARMCHAIR">Кресло</option>
                <option value="OTHER">Другое</option>
              </select>
            </label>

            <div className={s.switchRow}>
              <div>
                <div className={s.label}>Статус товара</div>
                <div style={{ fontWeight: 700, marginLeft: 2, marginTop: 5 }}>{active ? ' Активен' : ' Выключен'}</div>
              </div>
              <input type="checkbox" className={s.switch} checked={active} onChange={(e) => setActive(e.target.checked)} />
            </div>
          </div>

          {/* Правая колонка */}
          <div className={s.section}>
            <div className={s.fileRow}>
              <span className={s.label}>Изображение</span>
              {preview ? (
                <Image className={s.preview} src={preview} alt={name || 'Изображение товара'} width={800} height={600} unoptimized />
              ) : (
                <div className={s.previewPlaceholder}>Нет изображения</div>
              )}
              <input className={s.input} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className={s.field} style={{ marginTop: 10 }}>
              <span className={s.label}>Материалы (варианты)</span>
              <div style={{ display: 'grid', gap: 8 }}>
                {variants.map(v => (
                  <label key={v.id} className={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) =>
                        setVariants(prev => prev.map(x => x.id === v.id ? { ...x, active: e.target.checked } : x))
                      }
                    />
                    <span style={{ fontWeight: 500, minWidth: 120 }}>{v.material.name}</span>
                    <span style={{ opacity: .8 }}>{Number(v.price).toFixed(2)} BYN</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={s.actions}>
          <button className={s.btn} onClick={onClose} disabled={saving}>Отмена</button>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={save} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

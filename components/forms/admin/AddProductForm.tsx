'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { createProductSchema, type CreateProductDto } from '@/server/validations/product'
import s from './AddProductForm.module.css'

interface material {
    id: number
    name: string
    price_per_mm3: number
}

export default function AddProductForm() {
  const [form, setForm] = useState<CreateProductDto>({
    name: '',
    description: '',
    category: 'CHAIR', 
    width_mm: 0,
    height_mm: 0,
    depth_mm: 0,
    materials: [],
  })
  const [materialsList, setMaterialsList] = useState<material[]>([])
  const [loading, setLoading] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await fetch('/api/v1/admin/materials')
        if (!res.ok) throw new Error('Ошибка при загрузке материалов')
        const data = await res.json()
        setMaterialsList(data)
      } catch (err) {
        console.error(err)
        show({ title: 'Ошибка', description: 'Не удалось загрузить материалы', duration: 5000 })
      }
    }
    loadMaterials()
  }, [show])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const parsed = createProductSchema.safeParse(form)
    if (!parsed.success) {
      show({
        title: 'Ошибка',
        description: parsed.error.issues[0]?.message ?? 'Некорректно заполнены поля',
        duration: 6000,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Ошибка при добавлении товара')

      show({ title: 'Успешно', description: 'Товар успешно добавлен', duration: 5000 })
      setForm({
        name: '',
        description: '',
        category: 'CHAIR',
        width_mm: 0,
        height_mm: 0,
        depth_mm: 0,
        materials: [],
      })
    } catch (err) {
      show({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Неизвестная ошибка',
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <h2 className={s.title}>Добавление нового товара</h2>

        <form className={s.form} onSubmit={handleSubmit}>
         
          <label className={s.field}>
            <span className={s.label}>Название</span>
            <input
              className={s.input}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Описание</span>
            <textarea
              className={s.textarea}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Категория</span>
            <select
              className={s.input}
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as any })}
            >
              <option value="CHAIR">Стул</option>
              <option value="TABLE">Стол</option>
              <option value="BED">Кровать</option>
              <option value="WARDROBE">Шкаф</option>
            </select>
          </label>

          <div className={s.dimensions}>
            <label className={s.field}>
              <span className={s.label}>Ширина (мм)</span>
              <input
                type="number"
                className={s.input}
                value={form.width_mm}
                onChange={e => setForm({ ...form, width_mm: Number(e.target.value) })}
                required
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Высота (мм)</span>
              <input
                type="number"
                className={s.input}
                value={form.height_mm}
                onChange={e => setForm({ ...form, height_mm: Number(e.target.value) })}
                required
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Глубина (мм)</span>
              <input
                type="number"
                className={s.input}
                value={form.depth_mm}
                onChange={e => setForm({ ...form, depth_mm: Number(e.target.value) })}
                required
              />
            </label>
          </div>

          <fieldset className={s.field}>
            <span className={s.label}>Материалы</span>
            {materialsList.map(m => (
              <label key={m.id} className={s.checkbox}>
                <input
                  type="checkbox"
                  checked={form.materials.some(sel => sel.id === m.id)}
                  onChange={e => {
                    const exists = form.materials.find(sel => sel.id === m.id)
                    if (exists) {
                      setForm({
                        ...form,
                        materials: form.materials.filter(sel => sel.id !== m.id),
                      })
                    } else {
                      setForm({
                        ...form,
                        materials: [...form.materials, { id: m.id, price_per_mm3: m.price_per_mm3 }],
                      })
                    }
                  }}
                />
                <span>{m.name}</span>
              </label>
            ))}
          </fieldset>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Добавляем…' : 'Добавить товар'}
          </button>
        </form>
      </div>
    </div>
  )
}

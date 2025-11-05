import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'
import { jsonSafe } from '@/lib/bigint'
import { createProductSchema } from '@/server/validations/product'
import { ProductCategory } from '@prisma/client'

// --- адаптированная схема для PATCH ---
const updateProductSchema = createProductSchema.partial().extend({
  category: z.nativeEnum(ProductCategory).optional(),
  width_mm:  z.coerce.number().int().optional(),
  height_mm: z.coerce.number().int().optional(),
  depth_mm:  z.coerce.number().int().optional(),
  active: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        active: z.boolean(),
      })
    )
    .optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const productId = Number(id)

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ message: 'Некорректный ID' }, { status: 400 })
    }

    const formData = await req.formData()

    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      width_mm: formData.get('width_mm'),
      height_mm: formData.get('height_mm'),
      depth_mm: formData.get('depth_mm'),
      base_price: formData.get('base_price'),
      active: formData.get('active') === 'true',
      materials: formData.get('materials')
        ? JSON.parse(String(formData.get('materials')))
        : undefined,
      variants: formData.get('variants')
        ? JSON.parse(String(formData.get('variants')))
        : undefined,
      image: formData.get('image'),
    }

    const parsed = updateProductSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const data = parsed.data
    let image_path: string | undefined

    // --- сохраняем изображение, если есть ---
    const file = formData.get('image') as File | null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = path.extname(file.name || '.jpg').toLowerCase()
      const dir = path.join(process.cwd(), 'public', 'uploads', 'products')
      await fs.mkdir(dir, { recursive: true })
      const filename = `p_${productId}_${Date.now()}${ext}`
      await fs.writeFile(path.join(dir, filename), buffer)
      image_path = `/uploads/products/${filename}`
    }

    // --- обновляем товар ---
    const updated = await prisma.products.update({
      where: { id: BigInt(productId) },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.width_mm && { width_mm: Number(data.width_mm) }),
        ...(data.height_mm && { height_mm: Number(data.height_mm) }),
        ...(data.depth_mm && { depth_mm: Number(data.depth_mm) }),
        ...(data.base_price && { base_price: Number(data.base_price) }),
        ...(typeof data.active === 'boolean' && { active: data.active }),
        ...(image_path && { image_path }),
      },
      include: {
        variants: {
          include: { material: { select: { name: true, price_per_mm3: true } } },
        },
      },
    })

    // --- обновляем активности вариантов ---
    if (Array.isArray(data.variants) && data.variants.length) {
      await Promise.all(
        data.variants.map(v =>
          prisma.product_variants.update({
            where: { id: BigInt(v.id) },
            data: { active: v.active },
          })
        )
      )
    }

    return NextResponse.json(
      jsonSafe({ message: 'Товар обновлён', product: updated }),
      { status: 200 }
    )
  } catch (e: any) {
    console.error('PATCH /products/:id error:', e)
    return NextResponse.json(
      { message: 'Ошибка сервера', details: e?.message },
      { status: 500 }
    )
  }
}

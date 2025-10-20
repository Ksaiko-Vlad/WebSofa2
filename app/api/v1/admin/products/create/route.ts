import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/server/validations/product'

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const data = createProductSchema.parse(json)

    const { name, description, category, width_mm, height_mm, depth_mm, materials } = data

    const product = await prisma.products.create({
      data: {
        name,
        description,             
        category,                
        width_mm: width_mm,
        height_mm: height_mm,
        depth_mm: depth_mm,
        active: true,            
      },
    })

    const volume = width_mm * height_mm * depth_mm
    const variants = materials.map(m => ({
      product_id: product.id,
      material_id: BigInt(m.id),
      active: true,
      price: volume * m.price_per_mm3 / 1_000_000_000,
      sku: `${product.id}-${m.id}`,
    }))

    if (variants.length) {
      await prisma.product_variants.createMany({ data: variants })
    }

    const safeProduct = {
        ...product,
        id: Number(product.id),
        width_mm: Number(product.width_mm),
        height_mm: Number(product.height_mm),
        depth_mm: Number(product.depth_mm),
      }

    return NextResponse.json({ message: 'Товар создан', safeProduct }, { status: 201 })
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json({ message: e.issues[0]?.message ?? 'Некорректные данные' }, { status: 400 })
    }
    console.error('create product error', e)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

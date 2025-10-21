import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/server/validations/product'
import { jsonSafe } from '@/lib/bigint'

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
        width_mm,
        height_mm,
        depth_mm,
        active: true,
      },
    })

    const volume_mm3 = width_mm * height_mm * depth_mm

    const materialIds = materials.map(m => BigInt(m.id))
    const dbMaterials = await prisma.materials.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, price_per_mm3: true },
    })

    const variants = dbMaterials.map(m => {
      const pricePer = Number(m.price_per_mm3)
      const price = volume_mm3 * pricePer

      return {
        product_id: product.id,
        material_id: m.id,
        active: true,
        price,
        sku: `${product.id}-${m.id}`,
      }
    })

    if (variants.length) {
      await prisma.product_variants.createMany({ data: variants })
    }

    return NextResponse.json(jsonSafe({ message: 'Товар создан', product, variants }), { status: 201 })
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json(
        { message: e.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    console.error('create product error', e)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

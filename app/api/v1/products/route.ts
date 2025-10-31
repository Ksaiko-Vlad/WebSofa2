import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonSafe } from '@/lib/bigint'
import type { ProductDto } from '@/types/product'

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        width_mm: true,
        height_mm: true,
        depth_mm: true,
        variants: {
          select: {
            sku: true,
            price: true,
            material: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    })

    const normalized = jsonSafe(products) as ProductDto[]

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('products fetch error', err)
    return NextResponse.json(
      { message: 'Ошибка при загрузке товаров', error: String(err) },
      { status: 500 }
    )
  }
}

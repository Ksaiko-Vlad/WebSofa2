import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const materials = await prisma.materials.findMany({
      select: { id: true, name: true, price_per_mm3: true },
      orderBy: { id: 'asc' },
    })

    // Приводим BigInt и Decimal → в обычные числа
    const normalized = materials.map(m => ({
      id: Number(m.id),
      name: m.name,
      price_per_mm3: Number(m.price_per_mm3),
    }))

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('materials fetch error', err)
    return NextResponse.json({ message: 'Ошибка при загрузке материалов' }, { status: 500 })
  }
}

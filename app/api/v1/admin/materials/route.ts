import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonSafe } from '@/lib/bigint'

export async function GET() {
  try {
    const materials = await prisma.materials.findMany({
      select: { id: true, name: true, price_per_mm3: true },
      orderBy: { id: 'asc' },
    })


    return NextResponse.json(jsonSafe(materials))
  } catch (err) {
    console.error('materials fetch error', err)
    return NextResponse.json({ message: 'Ошибка при загрузке материалов' }, { status: 500 })
  }
}

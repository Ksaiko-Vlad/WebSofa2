import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonSafe } from '@/lib/bigint'
import { z } from 'zod'

export async function GET() {
  try {
    const materials = await prisma.materials.findMany({
      select: { id: true, name: true, color: true, price_per_mm3: true, active: true },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(jsonSafe(materials))
  } catch (err) {
    console.error('materials fetch error', err)
    return NextResponse.json({ message: 'Ошибка при загрузке материалов' }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
  price_per_mm3: z.union([z.string(), z.number()]), 
  active: z.boolean().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Неверные данные', issues: parsed.error.issues }, { status: 400 })
    }

    const data = parsed.data

    const material = await prisma.materials.create({
      data: {
        name: data.name,
        color: data.color,
        price_per_mm3: data.price_per_mm3 as any,
        active: data.active ?? true,
      },
      select: { id: true, name: true, color: true, price_per_mm3: true, active: true },
    })

    return NextResponse.json({ material: jsonSafe(material) }, { status: 201 })
  } catch (err: any) {
    console.error('material create error', err)
    return NextResponse.json({ message: 'Ошибка при создании материала' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonSafe } from '@/lib/bigint'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  price_per_mm3: z.union([z.string(), z.number()]).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Неверные данные', issues: parsed.error.issues }, { status: 400 })
    }

    const updated = await prisma.materials.update({
      where: { id: BigInt(idNum) },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        ...(parsed.data.price_per_mm3 !== undefined ? { price_per_mm3: parsed.data.price_per_mm3 as any } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
      select: { id: true, name: true, color: true, price_per_mm3: true, active: true },
    })

    return NextResponse.json({ material: jsonSafe(updated) })
  } catch (err: any) {
    console.error('material update error', err)
    return NextResponse.json({ message: 'Ошибка при обновлении материала' }, { status: 500 })
  }
}

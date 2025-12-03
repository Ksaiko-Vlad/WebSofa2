import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { jsonSafe } from '@/lib/bigint'

export const runtime = 'nodejs'

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  role: z.nativeEnum(Role),
  active: z.coerce.boolean().optional(),

  first_name: z.string().trim().optional().nullable(),
  second_name: z.string().trim().optional().nullable(),
  last_name: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
})

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        first_name: true,
        second_name: true,
        last_name: true,
        phone: true,
        role: true,
        active: true,
        created_at: true,
      },
    })

    return NextResponse.json(jsonSafe(users), { status: 200 })
  } catch (err) {
    console.error('users fetch error', err)
    return NextResponse.json({ message: 'Ошибка при загрузке пользователей' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Неверные данные' },
        { status: 400 }
      )
    }

    const d = parsed.data
    const password_hash = await bcrypt.hash(d.password, 10)

    const created = await prisma.users.create({
      data: {
        email: d.email,
        password_hash,
        role: d.role,
        active: typeof d.active === 'boolean' ? d.active : true,

        first_name: d.first_name?.trim() || null,
        second_name: d.second_name?.trim() || null,
        last_name: d.last_name?.trim() || null,
        phone: d.phone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        second_name: true,
        last_name: true,
        phone: true,
        role: true,
        active: true,
        created_at: true,
      },
    })

    return NextResponse.json({ user: jsonSafe(created) }, { status: 201 })
  } catch (err: any) {
    // Prisma unique violation
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { message: 'Email или телефон уже заняты' },
        { status: 409 }
      )
    }
    console.error('user create error', err)
    return NextResponse.json({ message: 'Ошибка при создании пользователя' }, { status: 500 })
  }
}

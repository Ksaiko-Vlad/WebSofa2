import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonSafe } from "@/lib/bigint"

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
        return NextResponse.json(jsonSafe(users))
    } catch (err) {
        console.error('users fetch error', err)
        return NextResponse.json(
            { message: 'Ошибка при загрузке пользователей' },
            { status: 500 },
        )

    }
}
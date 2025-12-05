import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/server/validations/profile';

export async function POST(req: NextRequest) {
    try {
        const cookieToken = (await cookies()).get('auth_token')?.value;

        const auth = req.headers.get("authorization") || "";
        const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        const token = bearer || cookieToken;
        if (!token) return NextResponse.json({ message: 'Нет доступа' }, { status: 401 });

        const payload = await verifyJwt(token);
        const json = await req.json();
        const data = updateProfileSchema.parse(json);

        await prisma.users.update({
            where: { id: BigInt(payload.sub) },
            data,
        });

        return NextResponse.json({ message: 'ОК' }, { status: 200 });
    } catch (e: any) {
        if (e.issues?.length) {
            return NextResponse.json(
                { message: e.issues[0]?.message ?? 'Неверные данные' },
                { status: 400 }
            );
        }
        if (e?.code === 'P2002' && Array.isArray(e?.meta?.target) && e.meta.target.includes('phone')) {
            return NextResponse.json({ message: 'Телефон уже занят' }, { status: 409 });
        }

        console.error('update user error:', e);
        return NextResponse.json({ message: 'Ошибка обновления' }, { status: 500 });
    }

}
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/server/services/auth.service';
import { signJwt, getCookieName } from '@/lib/jwt';
import { toPlainUser } from '@/lib/bigint';
import type { users } from '@prisma/client';

interface RegisterBody {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  second_name?: string | null;
  phone?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const { email, password, first_name, last_name, second_name, phone } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: 'email и password обязательны' }, { status: 400 });
    }

    const user: users = await registerUser({
      email,
      password,
      first_name,
      last_name,
      second_name,
      phone,
    });

    const payload = { sub: user.id.toString(), role: user.role, email: user.email };
    const token = await signJwt(payload);

    const res = NextResponse.json({ user: toPlainUser(user), token }, { status: 201 });
    res.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return res;
  } catch (e: any) {
    if (e.code === 'EMAIL_TAKEN') {
      return NextResponse.json({ message: e.message }, { status: 409 });
    }
    console.error('register error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

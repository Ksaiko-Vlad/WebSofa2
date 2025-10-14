import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { users, Role, Prisma } from '@prisma/client';

export interface RegisterUserInput {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  second_name?: string | null;
  phone?: string | null;
}

export async function registerUser({
  email,
  password,
  first_name,
  last_name,
  second_name,
  phone,
}: RegisterUserInput): Promise<users> {
  const normalizedEmail = String(email).trim().toLowerCase();

  const exists = await prisma.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (exists) {
    const err = new Error('Пользователь с таким email уже существует');
    (err as any).code = 'EMAIL_TAKEN';
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);

  
  const data: Prisma.usersUncheckedCreateInput = {
    email: normalizedEmail,
    password_hash,
    role: 'customer' as Role,
    first_name: first_name ?? null,
    last_name: last_name ?? null,
    second_name: second_name ?? null,
    phone: phone ?? '',
    created_at: new Date(),
    active: true,
  };

  const user = await prisma.users.create({ data });
  return user;
}

export interface LoginUserInput {
  email: string;
  password: string;
  phone?: string | null;
}

export async function loginUser({
  email,
  password,
  phone,
}: LoginUserInput): Promise<users> {
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password_hash) {
    const err = new Error('Неверный e-mail или пароль');
    (err as any).code = 'BAD_CREDENTIALS';
    throw err;
  }

  if (phone && user.phone && user.phone !== phone) {
    const err = new Error('Неверные данные');
    (err as any).code = 'BAD_CREDENTIALS';
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error('Неверный пароль');
    (err as any).code = 'BAD_PASSWORD';
    throw err;
  }

  return user;
}

import type { Role } from '@prisma/client';

export type PlainUser = {
  id: string | number;
  role: Role;
  email: string;
  first_name: string | null;
  second_name: string | null;
  last_name: string | null;
  phone: string | null;
  active: boolean;
  created_at: Date | string;
};

export function toPlainUser(u: any): PlainUser | null {
  if (!u) return null;
  return {
    id: typeof u.id === 'bigint' ? u.id.toString() : u.id,
    role: u.role as Role,
    email: u.email,
    first_name: u.first_name ?? null,
    second_name: u.second_name ?? null,
    last_name: u.last_name ?? null,
    phone: u.phone ?? null,
    active: Boolean(u.active),
    created_at: u.created_at,
  };
}

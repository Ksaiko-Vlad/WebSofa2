import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введите корректный e-mail'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов').max(100, 'Пароль слишком длинный'),
  first_name: z.string().trim().min(1, 'Имя обязательно'),
  last_name: z.string().trim().min(1, 'Фамилия обязательна'),
  second_name: z.string().trim().optional().nullable(),
  phone: z.string().regex(/^\+?\d{7,15}$/, 'Введите корректный телефон').optional().nullable(),
});


export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введите корректный e-mail'),
  password: z.string().min(1, 'Введите пароль'),
  phone: z.string().optional().nullable(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

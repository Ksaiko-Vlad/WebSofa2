import { z } from 'zod';

export const phoneSchemaStrict = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/[\s()-]/g, '') : v),
  z
    .string()
    .min(1, 'Телефон обязателен')                     
    .regex(/^\+?\d{7,15}$/, 'Введите корректный телефон') 
);

export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(2, 'Введите имя'),
  last_name: z.string().trim().min(2, 'Введите фамилию'),
  second_name: z.string().trim().min(2, 'Введите отчество'),
  phone: phoneSchemaStrict,
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

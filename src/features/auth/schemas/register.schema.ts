import { z } from 'zod'
import { GENDER } from '@/config/enums'

// Khớp BE RegisterCommandValidator
export const registerSchema = z
  .object({
    email: z.email('Email không đúng định dạng').max(320),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    firstName: z.string().min(1, 'Vui lòng nhập tên').max(100),
    lastName: z.string().min(1, 'Vui lòng nhập họ').max(100),
    gender: z.enum(Object.keys(GENDER) as [keyof typeof GENDER, ...(keyof typeof GENDER)[]]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

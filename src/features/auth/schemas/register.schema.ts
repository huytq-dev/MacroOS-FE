import { z } from 'zod'
import { GENDER } from '@/config/enums'

// Khớp BE RegisterCommandValidator
export const registerSchema = z
  .object({
    email: z.email('Enter a valid email address').max(320),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    firstName: z.string().min(1, 'Enter your first name').max(100),
    lastName: z.string().min(1, 'Enter your last name').max(100),
    gender: z.enum(Object.keys(GENDER) as [keyof typeof GENDER, ...(keyof typeof GENDER)[]]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

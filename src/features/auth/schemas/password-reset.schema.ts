import { z } from 'zod'

// Khớp BE ForgotPasswordCommand
export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

// Khớp BE ResetPasswordCommandValidator (token lấy từ URL)
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Paste the token from your email'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

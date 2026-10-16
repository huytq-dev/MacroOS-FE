import { z } from 'zod'

// Khớp BE ForgotPasswordCommand
export const forgotPasswordSchema = z.object({
  email: z.email('Email không đúng định dạng'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

// Khớp BE ResetPasswordCommandValidator (token lấy từ URL)
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Dán token nhận qua email'),
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

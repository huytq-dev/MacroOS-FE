import type { Metadata } from 'next'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

export const metadata: Metadata = { title: 'Đặt lại mật khẩu' }

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />
}

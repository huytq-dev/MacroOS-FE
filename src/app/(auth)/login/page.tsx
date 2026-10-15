import type { Metadata } from 'next'
import { LoginPage } from '@/features/auth/pages/LoginPage'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default function LoginRoute() {
  return <LoginPage />
}

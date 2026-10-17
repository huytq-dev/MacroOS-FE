import type { Metadata } from 'next'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

export const metadata: Metadata = { title: 'Forgot password' }

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />
}

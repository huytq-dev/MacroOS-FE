import type { Metadata } from 'next'
import { ConfirmEmailPage } from '@/features/auth/pages/ConfirmEmailPage'

export const metadata: Metadata = { title: 'Xác thực email' }

export default function ConfirmEmailRoute() {
  return <ConfirmEmailPage />
}

import type { Metadata } from 'next'
import { ConfirmEmailPage } from '@/features/auth/pages/ConfirmEmailPage'

export const metadata: Metadata = { title: 'Verify email' }

export default function ConfirmEmailRoute() {
  return <ConfirmEmailPage />
}

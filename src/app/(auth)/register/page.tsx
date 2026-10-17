import type { Metadata } from 'next'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterRoute() {
  return <RegisterPage />
}

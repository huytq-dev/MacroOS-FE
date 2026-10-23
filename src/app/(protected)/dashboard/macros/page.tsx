import type { Metadata } from 'next'
import { MacrosDetailPage } from '@/features/dashboard/pages/MacrosDetailPage'

export const metadata: Metadata = { title: 'Macros' }

export default function MacrosRoute() {
  return <MacrosDetailPage />
}

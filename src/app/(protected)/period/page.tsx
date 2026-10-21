import type { Metadata } from 'next'
import { PeriodPage } from '@/features/period/pages/PeriodPage'

export const metadata: Metadata = { title: 'Period' }

export default function PeriodRoute() {
  return <PeriodPage />
}

import type { Metadata } from 'next'
import { AllMetricsPage } from '@/features/full-body/pages/AllMetricsPage'

export const metadata: Metadata = { title: 'All Metrics' }

export default function AllMetricsRoute() {
  return <AllMetricsPage />
}

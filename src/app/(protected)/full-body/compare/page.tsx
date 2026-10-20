import type { Metadata } from 'next'
import { CompareMetricsPage } from '@/features/full-body/pages/CompareMetricsPage'

export const metadata: Metadata = { title: 'Compare All Metrics' }

export default function CompareMetricsRoute() {
  return <CompareMetricsPage />
}

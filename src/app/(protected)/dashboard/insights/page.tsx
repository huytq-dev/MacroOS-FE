import type { Metadata } from 'next'
import { InsightsPage } from '@/features/dashboard/pages/InsightsPage'

export const metadata: Metadata = { title: 'Insights & Analytics' }

export default function InsightsRoute() {
  return <InsightsPage />
}

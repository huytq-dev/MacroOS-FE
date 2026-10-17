import type { Metadata } from 'next'
import { WeightTrendPage } from '@/features/dashboard/pages/WeightTrendPage'

export const metadata: Metadata = { title: 'Weight Trend' }

export default function WeightTrendRoute() {
  return <WeightTrendPage />
}

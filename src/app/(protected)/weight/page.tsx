import type { Metadata } from 'next'
import { WeightPage } from '@/features/weight/pages/WeightPage'

export const metadata: Metadata = { title: 'Weight' }

export default function WeightRoute() {
  return <WeightPage />
}

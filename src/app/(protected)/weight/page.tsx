import type { Metadata } from 'next'
import { WeightPage } from '@/features/weight/pages/WeightPage'

export const metadata: Metadata = { title: 'Cân nặng' }

export default function WeightRoute() {
  return <WeightPage />
}

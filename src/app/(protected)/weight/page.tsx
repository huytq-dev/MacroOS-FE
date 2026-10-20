import type { Metadata } from 'next'
import { ScaleWeightPage } from '@/features/weight/pages/ScaleWeightPage'

export const metadata: Metadata = { title: 'Scale Weight' }

export default function WeightRoute() {
  return <ScaleWeightPage />
}

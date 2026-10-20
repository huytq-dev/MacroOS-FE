import type { Metadata } from 'next'
import { ComparePage } from '@/features/progress-photos/pages/ComparePage'

export const metadata: Metadata = { title: 'Compare Progress Photos' }

export default function ProgressPhotosCompareRoute() {
  return <ComparePage />
}

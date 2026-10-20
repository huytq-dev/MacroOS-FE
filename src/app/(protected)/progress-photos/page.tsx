import type { Metadata } from 'next'
import { ProgressPhotosPage } from '@/features/progress-photos/pages/ProgressPhotosPage'

export const metadata: Metadata = { title: 'Progress Photos' }

export default function ProgressPhotosRoute() {
  return <ProgressPhotosPage />
}

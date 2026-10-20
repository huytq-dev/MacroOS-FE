import type { Metadata } from 'next'
import { VisualBodyFatPage } from '@/features/weight/pages/VisualBodyFatPage'

export const metadata: Metadata = { title: 'Visual Body Fat' }

export default function VisualBodyFatRoute() {
  return <VisualBodyFatPage />
}

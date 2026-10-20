import type { Metadata } from 'next'
import { FullBodyPage } from '@/features/full-body/pages/FullBodyPage'

export const metadata: Metadata = { title: 'Full Body' }

export default function FullBodyRoute() {
  return <FullBodyPage />
}

import type { Metadata } from 'next'
import { MorePage } from '@/features/more/pages/MorePage'

export const metadata: Metadata = { title: 'More' }

export default function MoreRoute() {
  return <MorePage />
}

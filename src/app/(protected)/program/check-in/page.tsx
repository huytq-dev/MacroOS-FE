import type { Metadata } from 'next'
import { CheckInHubPage } from '@/features/program/pages/CheckInHubPage'

export const metadata: Metadata = { title: 'Check-in' }

export default function CheckInRoute() {
  return <CheckInHubPage />
}

import type { Metadata } from 'next'
import { EnergyBalancePage } from '@/features/dashboard/pages/EnergyBalancePage'

export const metadata: Metadata = { title: 'Energy Balance' }

export default function EnergyBalanceRoute() {
  return <EnergyBalancePage />
}

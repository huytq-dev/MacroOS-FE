import type { Metadata } from 'next'
import { ExpenditurePage } from '@/features/dashboard/pages/ExpenditurePage'

export const metadata: Metadata = { title: 'Expenditure' }

export default function ExpenditureRoute() {
  return <ExpenditurePage />
}

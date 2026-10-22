import type { Metadata } from 'next'
import { ExpenditureSettingsPage } from '@/features/more/pages/ExpenditureSettingsPage'

export const metadata: Metadata = { title: 'Expenditure Settings' }

export default function ExpenditureSettingsRoute() {
  return <ExpenditureSettingsPage />
}

import type { Metadata } from 'next'
import { CustomizePage } from '@/features/dashboard/pages/CustomizePage'

export const metadata: Metadata = { title: 'Customize Dashboard' }

export default function CustomizeRoute() {
  return <CustomizePage />
}

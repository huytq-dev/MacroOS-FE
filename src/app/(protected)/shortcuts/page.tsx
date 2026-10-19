import type { Metadata } from 'next'
import { ShortcutsPage } from '@/features/shortcuts/pages/ShortcutsPage'

export const metadata: Metadata = { title: 'Shortcuts' }

export default function ShortcutsRoute() {
  return <ShortcutsPage />
}

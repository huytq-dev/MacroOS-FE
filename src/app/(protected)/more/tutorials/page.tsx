import type { Metadata } from 'next'
import { TutorialsPage } from '@/features/more/pages/TutorialsPage'

export const metadata: Metadata = { title: 'Tutorials' }

export default function TutorialsRoute() {
  return <TutorialsPage />
}

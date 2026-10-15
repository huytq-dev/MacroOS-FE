import type { Metadata } from 'next'
import { ProgramPage } from '@/features/program/pages/ProgramPage'

export const metadata: Metadata = { title: 'Program' }

export default function ProgramRoute() {
  return <ProgramPage />
}

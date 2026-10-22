import type { Metadata } from 'next'
import { ProgramPage } from '@/features/program/pages/ProgramPage'

export const metadata: Metadata = { title: 'Strategy' }

export default function ProgramRoute() {
  return <ProgramPage />
}

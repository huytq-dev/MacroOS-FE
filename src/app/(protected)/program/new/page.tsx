import type { Metadata } from 'next'
import { CreateProgramPage } from '@/features/program/pages/CreateProgramPage'

export const metadata: Metadata = { title: 'Create program' }

export default function CreateProgramRoute() {
  return <CreateProgramPage />
}

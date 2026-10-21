import type { Metadata } from 'next'
import { StepsPage } from '@/features/steps/pages/StepsPage'

export const metadata: Metadata = { title: 'Steps' }

export default function StepsRoute() {
  return <StepsPage />
}

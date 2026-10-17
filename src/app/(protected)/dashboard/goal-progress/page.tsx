import type { Metadata } from 'next'
import { GoalProgressPage } from '@/features/dashboard/pages/GoalProgressPage'

export const metadata: Metadata = { title: 'Goal Progress' }

export default function GoalProgressRoute() {
  return <GoalProgressPage />
}

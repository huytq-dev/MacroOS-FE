import type { Metadata } from 'next'
import { HabitsPage } from '@/features/habits/pages/HabitsPage'

export const metadata: Metadata = { title: 'Weigh-In' }

export default function WeighInHabitRoute() {
  return <HabitsPage kind="weigh-in" />
}

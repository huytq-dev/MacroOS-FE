import type { Metadata } from 'next'
import { HabitsPage } from '@/features/habits/pages/HabitsPage'

export const metadata: Metadata = { title: 'Food Logging' }

export default function FoodLoggingHabitRoute() {
  return <HabitsPage kind="food-logging" />
}

import type { Metadata } from 'next'
import { FoodLogPage } from '@/features/food-log/pages/FoodLogPage'

export const metadata: Metadata = { title: 'Food log' }

export default function FoodLogRoute() {
  return <FoodLogPage />
}

import type { Metadata } from 'next'
import { FoodLogPage } from '@/features/food-log/pages/FoodLogPage'

export const metadata: Metadata = { title: 'Nhật ký' }

export default function FoodLogRoute() {
  return <FoodLogPage />
}

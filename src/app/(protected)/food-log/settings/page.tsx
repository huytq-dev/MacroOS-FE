import type { Metadata } from 'next'
import { FoodLogSettingsPage } from '@/features/food-log/pages/FoodLogSettingsPage'

export const metadata: Metadata = { title: 'Food Log settings' }

export default function FoodLogSettingsRoute() {
  return <FoodLogSettingsPage />
}

import type { Metadata } from 'next'
import { NutritionDetailPage } from '@/features/dashboard/pages/NutritionDetailPage'

export const metadata: Metadata = { title: 'Nutrition' }

export default function NutritionRoute() {
  return <NutritionDetailPage />
}

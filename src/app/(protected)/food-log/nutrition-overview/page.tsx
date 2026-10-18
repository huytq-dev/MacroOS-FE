import type { Metadata } from 'next'
import { NutritionOverviewPage } from '@/features/food-log/pages/NutritionOverviewPage'

export const metadata: Metadata = { title: 'Nutrition Overview' }

export default function NutritionOverviewRoute() {
  return <NutritionOverviewPage />
}

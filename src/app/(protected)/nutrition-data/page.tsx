import type { Metadata } from 'next'
import { NutritionDataPage } from '@/features/nutrition-data/pages/NutritionDataPage'

export const metadata: Metadata = { title: 'Nutrition Data Manager' }

export default function NutritionDataRoute() {
  return <NutritionDataPage />
}

import type { Metadata } from 'next'
import { RecipeCreatePage } from '@/features/food-log/pages/RecipeCreatePage'

export const metadata: Metadata = { title: 'New recipe' }

export default function RecipeCreateRoute() {
  return <RecipeCreatePage />
}

import type { Metadata } from 'next'
import { LoggerFoodTilesPage } from '@/features/food-log/pages/LoggerFoodTilesPage'

export const metadata: Metadata = { title: 'Logger Food Tiles' }

export default function LoggerFoodTilesRoute() {
  return <LoggerFoodTilesPage />
}

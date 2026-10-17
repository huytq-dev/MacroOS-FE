import type { Metadata } from 'next'
import { TimelineFoodTilesPage } from '@/features/food-log/pages/TimelineFoodTilesPage'

export const metadata: Metadata = { title: 'Timeline Food Tiles' }

export default function TimelineFoodTilesRoute() {
  return <TimelineFoodTilesPage />
}

import type { Metadata } from 'next'
import { FoodsPage } from '@/features/foods/pages/FoodsPage'

export const metadata: Metadata = { title: 'Foods' }

export default function FoodsRoute() {
  return <FoodsPage />
}

import type { Metadata } from 'next'
import { FoodsPage } from '@/features/foods/pages/FoodsPage'

export const metadata: Metadata = { title: 'Thực phẩm' }

export default function FoodsRoute() {
  return <FoodsPage />
}

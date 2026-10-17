import type { Metadata } from 'next'
import { LoggerBannerPage } from '@/features/food-log/pages/LoggerBannerPage'

export const metadata: Metadata = { title: 'Customize Banner' }

export default function LoggerBannerRoute() {
  return <LoggerBannerPage />
}

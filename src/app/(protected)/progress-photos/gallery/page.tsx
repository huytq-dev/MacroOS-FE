import type { Metadata } from 'next'
import { GalleryPage } from '@/features/progress-photos/pages/GalleryPage'

export const metadata: Metadata = { title: 'Progress Photos Gallery' }

export default function ProgressPhotosGalleryRoute() {
  return <GalleryPage />
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findNutrient } from '@/features/nutrient-detail/nutrient-detail.utils'
import { NutrientDetailPage } from '@/features/nutrient-detail/pages/NutrientDetailPage'

interface NutrientRouteProps {
  readonly params: Promise<{ nutrient: string }>
}

export async function generateMetadata({ params }: NutrientRouteProps): Promise<Metadata> {
  return { title: findNutrient((await params).nutrient)?.nutrient.name ?? 'Nutrient' }
}

export default async function NutrientRoute({ params }: NutrientRouteProps) {
  const info = findNutrient((await params).nutrient)
  if (!info) notFound()
  return <NutrientDetailPage info={info} />
}

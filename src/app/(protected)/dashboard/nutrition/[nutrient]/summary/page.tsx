import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findNutrient } from '@/features/nutrient-detail/nutrient-detail.utils'
import { NutrientSummaryPage } from '@/features/nutrient-detail/pages/NutrientSummaryPage'

interface NutrientSummaryRouteProps {
  readonly params: Promise<{ nutrient: string }>
}

export async function generateMetadata({ params }: NutrientSummaryRouteProps): Promise<Metadata> {
  return { title: findNutrient((await params).nutrient)?.nutrient.name ?? 'Nutrient' }
}

export default async function NutrientSummaryRoute({ params }: NutrientSummaryRouteProps) {
  const info = findNutrient((await params).nutrient)
  if (!info) notFound()
  return <NutrientSummaryPage info={info} />
}

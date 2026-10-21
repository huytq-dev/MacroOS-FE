import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findNutrient } from '@/features/nutrient-detail/nutrient-detail.utils'
import { NutrientGoalsPage } from '@/features/nutrient-detail/pages/NutrientGoalsPage'

interface NutrientGoalsRouteProps {
  readonly params: Promise<{ nutrient: string }>
}

export const metadata: Metadata = { title: 'About Nutrient Goals' }

export default async function NutrientGoalsRoute({ params }: NutrientGoalsRouteProps) {
  const info = findNutrient((await params).nutrient)
  if (!info) notFound()
  return <NutrientGoalsPage info={info} />
}

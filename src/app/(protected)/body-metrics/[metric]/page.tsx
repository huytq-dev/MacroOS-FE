import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findMeasurement } from '@/features/weight/body-measurements'
import { MeasurementPage } from '@/features/weight/pages/MeasurementPage'

interface MeasurementRouteProps {
  readonly params: Promise<{ metric: string }>
}

export async function generateMetadata({ params }: MeasurementRouteProps): Promise<Metadata> {
  return { title: findMeasurement((await params).metric)?.label ?? 'Measurement' }
}

export default async function MeasurementRoute({ params }: MeasurementRouteProps) {
  const metric = findMeasurement((await params).metric)
  if (!metric) notFound()
  return <MeasurementPage metricKey={metric.key} />
}

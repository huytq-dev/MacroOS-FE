import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GoalEditStepPage } from '@/features/program/pages/GoalEditStepPage'

export const metadata: Metadata = { title: 'Edit goal' }

export default async function GoalEditStepRoute({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params
  if (step !== 'params' && step !== 'review') notFound()
  return <GoalEditStepPage step={step} />
}

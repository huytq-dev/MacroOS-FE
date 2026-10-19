import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NewProgramStepPage } from '@/features/program/pages/NewProgramStepPage'
import { isWizardStep } from '@/features/program/utils/new-program-steps'

export const metadata: Metadata = { title: 'New program' }

export default async function NewProgramStepRoute({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params
  if (!isWizardStep(step)) notFound()
  return <NewProgramStepPage step={step} />
}

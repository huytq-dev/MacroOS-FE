import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckInModulePage } from '@/features/program/pages/CheckInModulePage'
import { isModuleKey } from '@/features/program/utils/check-in.utils'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckInModuleRoute({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module } = await params
  if (!isModuleKey(module)) notFound()
  return <CheckInModulePage module={module} />
}

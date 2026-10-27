import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EXPENDITURE_PREVIEW } from '@/features/dashboard/expenditure-preview'
import { ExpenditurePreviewPage } from '@/features/dashboard/pages/ExpenditurePreviewPage'

export const metadata: Metadata = { title: 'Expenditure (preview)' }

/** Chỉ tồn tại khi build bật NEXT_PUBLIC_EXPENDITURE_PREVIEW=1; production: 404. */
export default function ExpenditurePreviewRoute() {
  if (!EXPENDITURE_PREVIEW) notFound()
  return (
    <Suspense fallback={null}>
      <ExpenditurePreviewPage />
    </Suspense>
  )
}

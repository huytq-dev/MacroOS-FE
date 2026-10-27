'use client'

import { useSyncExternalStore } from 'react'
import {
  ExpenditureScreen,
  type ExpenditureSource,
} from '../components/ExpenditurePage/ExpenditureScreen'
import { FLUX_PREVIEW_LABEL, fluxPreviewRequested, PREVIEW_LABEL_BE } from '../expenditure-preview'
import { useExpenditureDetail, useExpenditureWindowSummary } from '../hooks/use-expenditure-detail'
import type { Averaging } from '../expenditure.utils'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { useUnits } from '@/features/users/hooks/use-units'

const noop = () => () => undefined

/** Đường xem trước dải Flux của BE test: chỉ khi build bật cờ VÀ URL có ?fluxPreview=1 (production: luôn false). */
const useFluxPreview = () =>
  useSyncExternalStore(
    noop,
    () => fluxPreviewRequested(window.location.search),
    () => false
  )

/** Nguồn dữ liệu thật: chuỗi + insights của BE, trạng thái dựng lại số dẫn xuất, đơn vị của user. */
function useLiveSource(averaging: Averaging): ExpenditureSource {
  const preview = useFluxPreview()
  const data = useExpenditureDetail(averaging, preview ? true : undefined)
  const derived = useDerivedGate()
  const { energy } = useUnits()
  return {
    data,
    derived,
    energy,
    // BE báo bản xem trước chưa duyệt thì luôn có nhãn đó (kể cả khi không có ?fluxPreview=1); không thì chỉ nhãn của đường xem trước
    previewLabel:
      data.ready && data.flux.isPreview
        ? `Preview — ${FLUX_PREVIEW_LABEL}`
        : preview
          ? PREVIEW_LABEL_BE
          : null,
    showInsights: true,
  }
}

/**
 * Chi tiết "Expenditure" (bấm ô Expenditure ở Dashboard). Toàn bộ giao diện nằm ở `ExpenditureScreen` (dùng chung với màn xem trước); trang này chỉ nối dữ liệu thật của BE.
 */
export function ExpenditurePage() {
  return <ExpenditureScreen useSource={useLiveSource} useSummary={useExpenditureWindowSummary} />
}

import { TAPE_GROUPS } from '@/features/shortcuts/full-body.config'
import type { FullBodyHistoryItem, TapeField } from '@/features/shortcuts/types/body-metrics.types'
import { formatMonthYear } from '@/lib/date'
import type { Measure, WeightUnit } from '@/lib/units'

export type MetricKey = 'scaleWeightKg' | 'trendWeightKg' | 'visualBodyFatPercent' | TapeField

export interface MetricRowDef {
  readonly key: MetricKey
  readonly label: string
  readonly unit: 'kg' | '%' | 'cm'
}

export interface MetricSectionDef {
  readonly title: string
  readonly rows: readonly MetricRowDef[]
}

/** Các nhóm của All Metrics / Compare theo thứ tự MacroFactor. */
export const METRIC_SECTIONS: readonly MetricSectionDef[] = [
  {
    title: 'Weight & Body Fat',
    rows: [
      { key: 'scaleWeightKg', label: 'Scale Weight', unit: 'kg' },
      { key: 'trendWeightKg', label: 'Trend Weight', unit: 'kg' },
      { key: 'visualBodyFatPercent', label: 'Visual Body Fat', unit: '%' },
    ],
  },
  ...TAPE_GROUPS.map((group) => ({
    title: group.title,
    rows: group.fields.map((field) => ({
      key: field.key,
      label: field.label,
      unit: 'cm' as const,
    })),
  })),
]

export const metricValue = (item: FullBodyHistoryItem | undefined, key: MetricKey) => {
  if (!item) return null
  if (key === 'scaleWeightKg' || key === 'trendWeightKg' || key === 'visualBodyFatPercent')
    return item[key]
  return item.tape?.[key] ?? null
}

/** Một số lẻ, bỏ ".0": 26 → "26", 26.45 → "26.5". */
const trim = (value: number) => String(Math.round(value * 10) / 10)

/** Hàng cân nặng có đơn vị 'kg' (BE trả kg) nhưng hiện theo kg / lb của user (`weight`); % và cm giữ nguyên. */
export const formatMetric = (
  value: number,
  unit: MetricRowDef['unit'],
  weight: Measure<WeightUnit>
) =>
  unit === '%'
    ? `${trim(value)}%`
    : unit === 'kg'
      ? `${trim(weight.convert(value))} ${weight.unit}`
      : `${trim(value)} ${unit}`

/** "+3 cm" / "−1 cm" (dấu trừ thật), 0 thì "0 cm". */
export const formatChange = (
  delta: number,
  unit: MetricRowDef['unit'],
  weight: Measure<WeightUnit>
) => {
  const text = formatMetric(Math.abs(delta), unit, weight)
  return delta > 0 ? `+${text}` : delta < 0 ? `−${text}` : text
}

export type GoalType = string | null | undefined

/**
 * Màu thay đổi theo mục tiêu: % mỡ giảm luôn tốt; số đo/cân khác giảm là tốt khi đang giảm cân (`WeightLoss`), tăng là tốt
 * khi tăng cân (`WeightGain`); giữ cân hoặc chưa có mục tiêu thì trung tính.
 */
export const changeTone = (delta: number, key: MetricKey, goalType: GoalType) => {
  if (Math.abs(delta) < 0.05) return 'neutral' as const
  if (key === 'visualBodyFatPercent') return delta < 0 ? ('good' as const) : ('bad' as const)
  if (goalType === 'WeightLoss') return delta < 0 ? ('good' as const) : ('bad' as const)
  if (goalType === 'WeightGain') return delta > 0 ? ('good' as const) : ('bad' as const)
  return 'neutral' as const
}

/** Nhóm theo tháng ("October 2026"), giữ thứ tự mới nhất trước của BE. */
export const groupByMonth = (items: readonly FullBodyHistoryItem[]) => {
  const groups: { label: string; items: FullBodyHistoryItem[] }[] = []
  for (const item of items) {
    const label = formatMonthYear(item.date)
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

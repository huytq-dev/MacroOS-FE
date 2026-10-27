import { addDaysIso, daysBetween } from '@/lib/date'
import type { ExpenditureSeriesDay } from './types/expenditure-series.types'

/**
 * Kịch bản MÔ PHỎNG của MOS-BE chạy qua đường mã Flux V1 THẬT (BE/Docs/Design/Flux/preview/*.json, `dataSource: "SYNTHETIC"`, cùng hình JSON với API; đã bỏ trường debug truthKcal):
 * chỉ để xem dải trông thế nào ở từng tình huống. KHÔNG phải dữ liệu người dùng, KHÔNG phải kết quả production, V1 chưa qua tiêu chí kiểm chứng nên mọi nơi dùng chúng phải ghi nhãn
 * "MacroOS Flux V1 (preview, unapproved)". Chỉ trang /expenditure-preview (build bật cờ) nạp các file này.
 */
export interface PreviewFixture {
  readonly dataSource: string
  readonly scenarioId: string
  readonly scenarioName: string
  readonly to: string
  readonly days: ExpenditureSeriesDay[]
  readonly fluxIsPreview: boolean
  readonly fluxOverallStatus: string | null
}

export const PREVIEW_SCENARIOS = [
  ['S01', 'Stable 2500'],
  ['S04', 'Step up 2400 → 2800'],
  ['S05', 'Step down 2800 → 2400'],
  ['S07', 'Glycogen shifts'],
  ['S11', 'Holding → Updating'],
  ['S12a', 'Calibrating → Updating'],
  ['S18', 'No valid observations'],
] as const

export type PreviewScenarioId = (typeof PREVIEW_SCENARIOS)[number][0]

const LOADERS: Record<PreviewScenarioId, () => Promise<{ default: unknown }>> = {
  S01: () => import('../../../dev-fixtures/expenditure-flux/S01.json'),
  S04: () => import('../../../dev-fixtures/expenditure-flux/S04.json'),
  S05: () => import('../../../dev-fixtures/expenditure-flux/S05.json'),
  S07: () => import('../../../dev-fixtures/expenditure-flux/S07.json'),
  S11: () => import('../../../dev-fixtures/expenditure-flux/S11.json'),
  S12a: () => import('../../../dev-fixtures/expenditure-flux/S12a.json'),
  S18: () => import('../../../dev-fixtures/expenditure-flux/S18.json'),
}

export const isPreviewScenario = (id: string | null): id is PreviewScenarioId =>
  PREVIEW_SCENARIOS.some(([key]) => key === id)

export async function loadPreviewFixture(id: PreviewScenarioId): Promise<PreviewFixture> {
  return (await LOADERS[id]()).default as PreviewFixture
}

/** Dời toàn bộ ngày để ngày cuối trùng `today` (biểu đồ neo vào hôm nay); số kcal / dải giữ nguyên. */
export function alignToToday(
  days: readonly ExpenditureSeriesDay[],
  today: string
): ExpenditureSeriesDay[] {
  if (days.length === 0) return []
  const shift = daysBetween(days[days.length - 1].date, today)
  return days.map((day) => ({ ...day, date: addDaysIso(day.date, shift) }))
}

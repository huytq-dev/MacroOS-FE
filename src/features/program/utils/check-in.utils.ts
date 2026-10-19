import type { CheckInModule, CheckInPreview } from '../types/check-in.types'

export interface ModuleMeta {
  readonly title: string
  readonly description: string
  readonly cta: string
}

/** Ba module của check-in (key do BE trả, thứ tự hiển thị lấy theo thứ tự mảng của BE). */
export const MODULE_META: Readonly<Record<string, ModuleMeta>> = {
  intro: {
    title: 'Introduction',
    description: 'A quick tour of how weekly check-ins work.',
    cta: 'Go to Introduction',
  },
  'partial-logging': {
    title: 'Partial Logging',
    description: "Mark the days when you didn't log everything you ate.",
    cta: 'Go to Partial Logging',
  },
  'program-update': {
    title: 'Program Update',
    description: 'We review your metabolism and update your targets.',
    cta: 'Go to Program Update',
  },
}

export const isModuleKey = (value: string): boolean => value in MODULE_META

/** Module hiện ở hub: bỏ module đã tắt (`hidden`) và key lạ (FE chưa biết). */
export const visibleModules = (modules: readonly CheckInModule[]): CheckInModule[] =>
  modules.filter((module) => module.state !== 'hidden' && isModuleKey(module.key))

/** Chữ cái thứ của một ngày yyyy-MM-dd (M T W T F S S) cho nhãn biểu đồ. */
export const dayLetterOf = (iso: string): string =>
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(`${iso}T00:00:00`).getDay()]

const kg = (value: number | null) => (value === null ? '' : Math.abs(value).toFixed(1))

/**
 * Mã lý do BE → câu tiếng Anh, ghép số từ `reasonParams`. Mã lạ thì bỏ; không có câu nào thì dùng câu chung (BE có thể thêm mã mới
 * mà FE chưa cập nhật).
 */
export function reasonSentences(preview: CheckInPreview): string[] {
  const params = preview.reasonParams
  const templates: Record<string, string> = {
    CALIBRATING:
      "We're still learning how your metabolism works, so your targets stay the same for now.",
    HOLDING:
      'We need a bit more data before changing anything, so your targets stay the same this week.',
    INCOMPLETE_DAYS: `You marked ${params.daysMarkedIncomplete} ${params.daysMarkedIncomplete === 1 ? 'day' : 'days'} as incomplete, so we left ${params.daysMarkedIncomplete === 1 ? 'it' : 'them'} out of your estimate.`,
    FASTER_THAN_TARGET: `Your weight trend is moving faster than your goal${params.weightChangeKg === null ? '' : ` (${kg(params.weightChangeKg)} kg this week)`}.`,
    SLOWER_THAN_TARGET: `Your weight trend is moving slower than your goal${params.weightChangeKg === null ? '' : ` (${kg(params.weightChangeKg)} kg this week)`}.`,
    ON_TARGET: "You're right on track with your goal.",
    CLAMPED: 'We limited this change so your adjustments stay gradual.',
    FLOOR_APPLIED: 'We stopped at your Calorie floor.',
  }
  const sentences = preview.reasonCodes.flatMap((code) =>
    templates[code] ? [templates[code]] : []
  )
  return sentences.length > 0
    ? sentences
    : ['We reviewed your week and kept your program up to date.']
}

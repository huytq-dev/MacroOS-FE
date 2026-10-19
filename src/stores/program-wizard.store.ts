import { create } from 'zustand'
import type { DayOfWeek, DietStyle, ProgramType, ProteinLevel } from '@/config/enums'
import type { EditableDay } from '@/features/program/utils/day-macros'
import type {
  CalorieFloorChoice,
  CalorieShiftMode,
} from '@/features/onboarding/types/onboarding.types'
import type { TrainingType } from '@/features/program/types/program.types'

export type ManualMode = 'same' | 'different'

/** Mục tiêu nhập tay một ngày (Manual). */
export interface ManualDay {
  readonly kcal: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

interface WizardPrefs {
  programType: ProgramType | null
  dietStyle: DietStyle | null
  floor: Exclude<CalorieFloorChoice, 'Off'> | null
  trainingType: TrainingType | null
  distribution: CalorieShiftMode | null
  shiftDays: DayOfWeek[]
  shiftPercent: number
  proteinLevel: ProteinLevel | null
  manualMode: ManualMode | null
}

export interface WizardStore extends WizardPrefs {
  /** Collaborative: bảy ngày đang chỉnh ở editor (khởi tạo từ preview của BE khi vào editor). */
  days: EditableDay[] | null
  /** Bảy ngày gốc BE đề xuất (để Reset All Days về lại). */
  baseDays: EditableDay[] | null
  /** Manual: mục tiêu nhập tay (một bộ dùng chung hoặc bảy bộ). */
  manualDays: ManualDay[] | null
  setPref: <K extends keyof WizardPrefs>(key: K, value: WizardPrefs[K]) => void
  setDays: (days: EditableDay[] | null) => void
  /** Gieo bảy ngày từ BE: vừa là số đang chỉnh, vừa là gốc cho Reset All Days. */
  seedDays: (days: EditableDay[]) => void
  updateDay: (index: number, patch: Partial<EditableDay>) => void
  setManualDays: (days: ManualDay[] | null) => void
  reset: () => void
}

const INITIAL: WizardPrefs & { days: null; baseDays: null; manualDays: null } = {
  programType: null,
  dietStyle: null,
  floor: null,
  trainingType: null,
  distribution: null,
  shiftDays: [],
  shiftPercent: 10,
  proteinLevel: null,
  manualMode: null,
  days: null,
  baseDays: null,
  manualDays: null,
}

/**
 * Lựa chọn của wizard New Program (không lưu lại: tải lại trang thì quay về hub). Đổi bất kỳ lựa chọn nào phía trước editor thì bảy
 * ngày đã chỉnh bị bỏ để editor lấy lại số mới từ BE.
 */
export const useProgramWizardStore = create<WizardStore>()((set) => ({
  ...INITIAL,
  setPref: (key, value) =>
    set({ [key]: value, days: null, baseDays: null } as Partial<WizardStore>),
  setDays: (days) => set({ days }),
  seedDays: (days) => set({ days, baseDays: days }),
  updateDay: (index, patch) =>
    set((state) =>
      state.days
        ? {
            days: state.days.map((day, position) =>
              position === index ? { ...day, ...patch } : day
            ),
          }
        : state
    ),
  setManualDays: (manualDays) => set({ manualDays }),
  reset: () => set(INITIAL),
}))

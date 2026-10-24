import type { TargetProvenance } from '@/features/nutrition/target-provenance'
import type { Feasibility } from './feasibility.types'

// Khớp BE Contract/Models/CheckIns/CheckInModels.cs (GET /check-ins/session)

/** required: bắt buộc; skippable: có thể bỏ qua; hidden: đã tắt (không hiện). */
export type CheckInModuleState = 'required' | 'skippable' | 'hidden'

export interface CheckInModule {
  key: string
  state: CheckInModuleState
}

export interface CheckInDay {
  /** yyyy-MM-dd. */
  date: string
  /** null = chưa log ngày đó. */
  kcal: number | null
  /** null = chưa có target. */
  targetKcal: number | null
  /** VERIFIED | LEGACY_UNVERIFIED | null (khi `targetKcal` null): LEGACY_UNVERIFIED = chỉ để tham khảo, không dùng cho kết luận đạt / không đạt. */
  targetProvenance?: TargetProvenance | null
  suspectedIncomplete: boolean
  markedIncomplete: boolean
}

export interface CheckInWeekSummary {
  avgCaloriesIn: number
  daysLogged: number
  daysMarkedIncomplete: number
  trendStartKg: number | null
  trendNowKg: number | null
  rateActualKgPerWeek: number | null
  rateTargetKgPerWeek: number
  tdeeKcal: number
  expenditureStatus: string
}

export interface CheckInProposal {
  previousCalories: number
  newCalories: number
  delta: number
  proteinG: number
  carbsG: number
  fatG: number
  clamped: boolean
  floorApplied: boolean
  /** Câu lý do BE dựng sẵn (không hiện: FE ghép câu tiếng Anh từ `reasonCodes` + `reasonParams`). */
  reason: string
  weeklyBudgetKcal: number | null
}

/** Số liệu cho câu lý do (FE tự ghép tiếng Anh từ `reasonCodes`). */
export interface CheckInReasonParams {
  avgKcalIn: number
  daysLogged: number
  daysMarkedIncomplete: number
  weightChangeKg: number | null
  oldKcal: number
  newKcal: number
  oldProteinG: number
  oldCarbsG: number
  oldFatG: number
  newProteinG: number
  newCarbsG: number
  newFatG: number
}

export interface CheckInPreview {
  nextCheckInDate: string
  isDue: boolean
  alreadyCheckedInToday: boolean
  week: CheckInWeekSummary
  /** null khi Calibrating / Holding: Accept lúc đó giữ nguyên target tuần trước. */
  proposal: CheckInProposal | null
  changed: boolean
  reasonCodes: string[]
  reasonParams: CheckInReasonParams
  /** Kiểm khả thi của đề xuất (HTTP 200): `isFeasible = false` thì Accept bị 400 cùng object này và không ghi gì. */
  feasibility?: Feasibility | null
  /** Ready | Updating | Failed lúc BE dựng preview (cùng giá trị `GET /derived-data/status`); BE cũ không gửi = coi như Ready. */
  derivedDataState?: string
  /** G6: null = Accept được phép; DERIVED_DATA_UPDATING | DERIVED_DATA_FAILED = `POST /check-ins/accept` sẽ bị 409 (không ghi gì). Decline luôn được. */
  acceptBlockedReason?: string | null
}

export interface CheckInSession {
  nextCheckInDate: string
  isDue: boolean
  alreadyCheckedInToday: boolean
  modules: CheckInModule[]
  /** 7 ngày gần nhất, cũ → mới, kết thúc hôm nay. */
  days: CheckInDay[]
  preview: CheckInPreview
}

// Khớp BE SetCheckInModulesCommand (null = giữ nguyên)
export interface SetCheckInModulesRequest {
  introSeen?: boolean | null
  partialLoggingHidden?: boolean | null
}

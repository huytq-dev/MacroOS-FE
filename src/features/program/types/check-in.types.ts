// Khớp BE Contract/Models/CheckIns/CheckInModels.cs (GET /check-ins/session)

/** Key module theo thứ tự BE trả; key lạ thì FE bỏ qua. */
export type CheckInModuleKey = 'intro' | 'partial-logging' | 'program-update'

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

// Khớp BE GET /api/periods và PUT /api/periods/days/{date} (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 5)

export interface PeriodEntry {
  id: string
  /** yyyy-MM-dd */
  startDate: string
  endDate: string | null
  /** Số ngày từ đầu kỳ trước tới đầu kỳ này (BE tự tính); null ở kỳ đầu tiên. */
  cycleLengthDays: number | null
  /** Số ngày hành kinh (BE tự tính từ start–end); null khi chưa có ngày kết thúc. */
  periodLengthDays: number | null
  symptoms: string | null
  notes: string | null
}

export interface PeriodHistory {
  items: PeriodEntry[]
  lastStartDate: string | null
  daysSinceLastStart: number | null
  /** Độ dài (ngày) của kỳ gần nhất, cho "Last Period Duration"; BE cũ chưa trả thì FE suy từ `items`. */
  lastPeriodLengthDays?: number | null
}

/** Body của PUT /periods/days/{date}: bật = ngày đó là ngày hành kinh, tắt = bỏ khỏi kỳ (BE tự gộp / tách các khoảng). */
export interface SetPeriodDayRequest {
  isOnPeriod: boolean
}

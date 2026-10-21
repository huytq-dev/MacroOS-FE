// Khớp BE GET/POST /api/periods và PUT/DELETE /api/periods/{id} (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 5)

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
}

/** Body chung của POST /periods và PUT /periods/{id}; trùng `startDate` ở POST = 409. */
export interface PeriodRequest {
  startDate: string
  endDate: string | null
  symptoms: string | null
  notes: string | null
}

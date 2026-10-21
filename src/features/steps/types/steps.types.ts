// Khớp BE GET/POST /api/steps và DELETE /api/steps/{logDate} (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 5)

export interface StepsEntry {
  id: string
  /** yyyy-MM-dd */
  logDate: string
  steps: number
  /** Nguồn bản ghi (nhập tay / đồng bộ). */
  source: string
}

export interface StepsHistory {
  items: StepsEntry[]
  /** Trung bình 7 ngày gần nhất; null = chưa có bước chân nào. */
  last7DayAverage: number | null
}

/** POST /steps: ghi đè theo ngày; `logDate` bỏ trống = hôm nay. */
export interface UpsertStepsRequest {
  logDate: string | null
  steps: number
}

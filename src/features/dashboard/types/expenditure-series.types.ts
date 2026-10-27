// Khớp BE GET /api/expenditure/series và GET /api/expenditure/insights (Docs/Design/Expenditure.md)

/** Calibrating và Holding đều vẽ ô vuông; chỉ Updating là vòng tròn. */
export type ExpenditureDayStatus = 'Calibrating' | 'Updating' | 'Holding'

/** Vì sao một ngày không có dải Flux (BE); mã lạ được FE coi như "chưa đủ bằng chứng". */
export type FluxReasonCode =
  'FLUX_DISABLED' | 'CALIBRATING' | 'NO_OBSERVATIONS' | 'INSUFFICIENT_EVIDENCE' | 'STATIC_OVERRIDE'

export interface ExpenditureSeriesDay {
  /** yyyy-MM-dd; LIÊN TỤC từ ngày có dữ liệu đầu tới hôm nay (BE đã fill-forward). */
  date: string
  expenditureKcal: number
  /**
   * Dải Flux Range của BE (MACROOS_FLUX_V1): luôn `low ≤ expenditureKcal ≤ high` khi có; null khi Calibrating hoặc chưa có quan sát hợp lệ (không bao giờ
   * dải giả); ngày Holding lặp lại dải cuối. FE chỉ VẼ dải này, KHÔNG tự sinh dải từ đường Expenditure (docs/Expenditure_Flux_UI_Plan.md).
   */
  fluxLowKcal?: number | null
  fluxHighKcal?: number | null
  /** Bản học được (= expenditureKcal) và bản đang dùng (khác nhau chỉ ở chế độ Static); thiếu ở BE cũ. Strategy / Check-in vẫn đọc bản HỌC ĐƯỢC (chưa nối với Active), nên FE không gọi Active là "số Strategy dùng". */
  learnedExpenditureKcal?: number
  activeExpenditureKcal?: number
  activeSource?: 'Learned' | 'Static'
  /** Available = ngày CÓ dải hợp lệ (chỉ khi đó mới vẽ); Unavailable thì fluxLow / fluxHigh luôn null, kèm `fluxReasonCode`. */
  fluxStatus?: 'Available' | 'Unavailable'
  fluxReasonCode?: FluxReasonCode | null
  /** Up = [TDEE, upper], Down = [lower, TDEE], Stable = độ rộng ≤ 1 kcal (vẽ như một đường mảnh); null khi không có dải. */
  fluxDirection?: 'Up' | 'Down' | 'Stable' | null
  status: ExpenditureDayStatus
  /** TDEE hôm nay − hôm qua (làm tròn); null ở ngày đầu. */
  changeKcal: number | null
}

/** Một nhóm Tuần / Tháng của BE: average = trung bình kcal học được của các ngày trong nhóm (tuần theo cài đặt user, tháng theo lịch); dải = average ± nửa độ rộng trung bình của các ngày CÓ dải (floor / ceil), luôn low ≤ average ≤ high, null nếu không ngày nào có dải. */
export interface ExpenditureSeriesBucket {
  start: string
  end: string
  count: number
  average: number
  fluxLowKcal?: number | null
  fluxHighKcal?: number | null
}

/** Thống kê của BE trên kcal học được của các ngày nằm trong [from, to] đã gửi: average = trung bình, difference = ngày cuối − ngày đầu (null nếu < 2 ngày); count 0 thì mọi giá trị null. */
export interface ExpenditureSeriesSummary {
  from: string
  to: string
  count: number
  average: number | null
  difference: number | null
  first: number | null
  last: number | null
  min: number | null
  max: number | null
}

export interface ExpenditureSeriesResponse {
  from: string
  to: string
  /** Tăng dần theo ngày; rỗng khi chưa có snapshot. */
  days: ExpenditureSeriesDay[]
  summary: ExpenditureSeriesSummary
  /** Chỉ có khi gửi `granularity`; do BE tính (trung bình kcal học được + dải Flux gộp theo chính sách của BE). FE KHÔNG tự lấy trung bình. */
  buckets?: ExpenditureSeriesBucket[] | null
  /** Phiên bản chính sách Flux (`MACROOS_FLUX_V1`); null khi không ngày nào có dải. Dải là "ước lượng bất đồng giữa các độ nhạy", không phải khoảng tin cậy. */
  fluxModel?: string | null
  fluxModelVersion?: string | null
  /** true CHỈ ở DB cô lập / dev bật Algorithm__FluxPreviewEnabled: dải là bản XEM TRƯỚC chưa được duyệt, nhãn "MacroOS Flux V1 (preview, unapproved)", KHÔNG gọi là live. */
  fluxIsPreview?: boolean
  calculationRevision?: number
  /** "Available" hoặc một mã lý do (vd. CALIBRATING). */
  fluxOverallStatus?: string | null
}

export type ExpenditureChangeStatus = 'Decrease' | 'Increase' | 'NoChange' | 'Waiting'

export interface ExpenditureInsightsResponse {
  today: string
  firstDate: string | null
  currentKcal: number | null
  strategy: 'Calibrating' | 'Updating' | 'Holding' | null
  /** Câu giải thích khi Holding. */
  holdingReason: string | null
  /** BE điền cho cả Holding và Calibrating; rỗng khi Updating. Mã lạ (BE thêm sau) được FE bỏ qua. */
  holdingReasonCodes: (
    | 'MissingLogs'
    | 'NoRecentWeighIn'
    | 'RecoveringLogs'
    | 'NeedsTwoWeighIns'
    | 'NoLogsBetweenWeighIns'
    | 'InitialCalibration'
  )[]
  calibratingDaysLeft: number | null
  /**
   * BE vòng 6 (chưa bật tới khi S25 áp dụng, nên tuỳ chọn): số ngày DỰ KIẾN để Updating chạy lại NẾU người dùng tiếp tục ghi dữ liệu hợp lệ (không phải cam kết);
   * null khi chưa có lần cân gần đây.
   */
  resumeInDays?: number | null
  /** BE vòng 6: số ngày liên tiếp có dữ liệu hợp lệ để Updating chạy lại (BE trả, FE không gõ cứng). */
  resumeConsecutiveDays?: number | null
  /** BE vòng 6: tên thuật toán duy nhất (cũng có ở `/expenditure/settings`). */
  algorithmName?: string | null
  loggedDaysLast7: number
  weighInDaysLast7: number
  /** Ngưỡng của BE để Updating chạy (ngày có log / ngày có cân trong 7 ngày); thiếu ở BE cũ. */
  minLoggedDaysPer7?: number
  minWeighInDaysPer7?: number
  changes: {
    days: 3 | 7 | 14 | 30 | 90
    changeKcal: number | null
    status: ExpenditureChangeStatus
  }[]
}

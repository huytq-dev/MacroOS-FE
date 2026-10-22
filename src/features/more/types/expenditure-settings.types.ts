/**
 * Hợp đồng BE `GET/PUT /expenditure/settings` + `POST /expenditure/mode` (MOS-Master: đã code ở BE, CHƯA bật tới khi migration S25 được duyệt, nên FE nối sau
 * cờ `EXPENDITURE_SETTINGS_API` / `EXPENDITURE_MODE_API`). Câu trả lời chưa có là `null`, KHÔNG có giá trị mặc định ngầm. Chỉ ảnh hưởng ước tính BAN ĐẦU,
 * không bao giờ đổi expenditure đã học.
 */
export type InitialEstimateMode = 'Formula' | 'Manual'
export type ManualInitialSource = 'Settings' | 'LegacyProgram'
export type BmrEquationKind = 'MacroFactor' | 'Cunningham'
export type BmrSex = 'Male' | 'Female'
export type AthleticPursuits =
  'ExerciseRegularly' | 'Athlete' | 'ProfessionalAthlete' | 'NoneOfTheAbove'
export type WeighedMoreThanBefore = 'Yes' | 'No' | 'NotSure'
export type CalculationMode = 'Dynamic' | 'Static'

export interface ExpenditureSettings {
  readonly initialEstimateMode: InitialEstimateMode | null
  readonly manualInitialTdeeKcal: number | null
  readonly manualInitialSource: ManualInitialSource | null
  readonly bmrEquation: BmrEquationKind
  readonly bmrSex: BmrSex | null
  readonly athleticPursuits: AthleticPursuits | null
  readonly weighedMoreThanBefore: WeighedMoreThanBefore | null
  readonly weighedMoreThanBeforeAtWeightKg: number | null
  /**
   * Ngưỡng Prior Weight ĐÃ LƯU lúc người dùng trả lời (BE v2; thay cho trường ngưỡng cũ đã bị BE bỏ): giá trị chính xác (kg) + số và đơn vị ĐÃ HIỆN cho người dùng.
   * Hàng Prior Weight hiện từ số + đơn vị ĐÃ HIỆN; null khi chưa trả lời. FE không tự tính ngưỡng.
   */
  readonly weighedMoreThanBeforeThresholdKg: number | null
  readonly weighedMoreThanBeforeThresholdShown: number | null
  readonly weighedMoreThanBeforeThresholdUnit: 'kg' | 'lb' | null
  /** Chỉ hiển thị-nội bộ của BE: KHÔNG vẽ ra giao diện (MacroFactor không có UI này) trừ khi MOS-Master yêu cầu. */
  readonly metabolicAdaptationEligibility?: 'NotApplicable' | 'Unknown' | 'Established'
  /** Tên thuật toán do BE trả (cũng ở `/expenditure/insights`); có thì dùng thay hằng ở FE. */
  readonly algorithmName?: string | null
  /** yyyy-MM-dd */
  readonly calculationStartDate: string | null
  readonly calculationStartDateSource: string | null
  readonly calculationRevision: number
  readonly mode: CalculationMode
  readonly staticTdeeKcal: number | null
}

/** PUT từng phần: chỉ gửi trường đổi. `manualInitialTdeeKcal` (1000–6000) chỉ đi cùng `initialEstimateMode: 'Manual'`. */
export interface SaveExpenditureSettingsRequest {
  readonly initialEstimateMode?: InitialEstimateMode
  readonly manualInitialTdeeKcal?: number
  readonly bmrEquation?: BmrEquationKind
  readonly bmrSex?: BmrSex
  readonly athleticPursuits?: AthleticPursuits
  /** BE lưu kèm cân nặng tại lúc trả lời. Gửi CÙNG hai trường ngưỡng ĐÃ HIỆN bên dưới. */
  readonly weighedMoreThanBefore?: WeighedMoreThanBefore
  /** Đúng số (1–2000) + đơn vị BE đã đưa ra trong câu hỏi (`GET /onboarding/prior-weight-question`). */
  readonly priorWeightThresholdShown?: number
  readonly priorWeightThresholdUnit?: 'kg' | 'lb'
}

/** `staticTdeeKcal` (1000–6000) bắt buộc khi `mode: 'Static'`; có hiệu lực từ "hôm nay" theo múi giờ người dùng. */
export interface SetCalculationModeRequest {
  readonly mode: CalculationMode
  readonly staticTdeeKcal?: number
}

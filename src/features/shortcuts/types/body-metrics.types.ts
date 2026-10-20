// Khớp BE GET/PUT/DELETE /api/body-metrics/full-body

/** Mọi ô đo (cm) đều tuỳ chọn; Bicep = leftArmCm / rightArmCm, Hips = hipCm. */
export interface TapeMeasurements {
  neckCm: number | null
  shouldersCm: number | null
  bustCm: number | null
  chestCm: number | null
  waistCm: number | null
  hipCm: number | null
  leftArmCm: number | null
  rightArmCm: number | null
  leftForearmCm: number | null
  rightForearmCm: number | null
  leftWristCm: number | null
  rightWristCm: number | null
  leftThighCm: number | null
  rightThighCm: number | null
  leftCalfCm: number | null
  rightCalfCm: number | null
  leftAnkleCm: number | null
  rightAnkleCm: number | null
}

export type TapeField = keyof TapeMeasurements

export interface FullBodyData {
  date: string
  visualBodyFatPercent: number | null
  tape: TapeMeasurements | null
  hasData: boolean
}

// Khớp BE GET /api/body-metrics/full-body/history (ngày có dữ liệu, mới nhất trước)
export interface FullBodyHistoryItem {
  date: string
  /** Số ô có giá trị: % mỡ Visual + các ô đo vòng. */
  metricCount: number
  visualBodyFatPercent: number | null
  tape: TapeMeasurements | null
  scaleWeightKg: number | null
  trendWeightKg: number | null
}

export interface FullBodyHistory {
  items: FullBodyHistoryItem[]
}

export interface FullBodyRequest {
  date: string
  visualBodyFatPercent: number | null
  tape: Partial<TapeMeasurements> | null
}

// Khớp BE /api/progress-photos
export type PhotoAngle = 'Front' | 'Side' | 'Back'

export interface ProgressPhoto {
  id: string
  angle: PhotoAngle
  /** Đường dẫn tương đối có chữ ký, hết hạn ~15 phút: dùng thẳng trong <img src>, không lưu / cache. */
  url: string
  expiresAt: string
  capturedAt: string
}

export interface ProgressPhotosData {
  date: string
  hasConsent: boolean
  photos: ProgressPhoto[]
}

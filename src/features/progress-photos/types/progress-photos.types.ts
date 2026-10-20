// Khớp BE /api/progress-photos (GET sessions theo MOS-BE; PUT multipart, DELETE ?date=&angle?)
export type PhotoAngle = 'Front' | 'Side' | 'Back'

export interface PhotoItem {
  id: string
  angle: PhotoAngle
  /** Đường dẫn tương đối có chữ ký, hết hạn ~15 phút: dùng thẳng trong <img src>, không lưu lâu. */
  url: string
  expiresAt: string
  capturedAt: string
}

/** Một ngày có ảnh: tối đa 3 ảnh (Front / Side / Back) và cân nặng của ngày đó. */
export interface PhotoSession {
  /** yyyy-MM-dd. */
  date: string
  photos: PhotoItem[]
  scaleWeightKg: number | null
  trendWeightKg: number | null
}

export interface PhotoSessionsResponse {
  hasConsent: boolean
  /** Mới nhất trước. */
  sessions: PhotoSession[]
}

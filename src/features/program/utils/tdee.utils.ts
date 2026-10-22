/**
 * Giới hạn TDEE nhập tay: khớp BE (validator của `SetManualTdee`: số NGUYÊN 1000–6000 kcal/ngày). Đổi ở BE thì đổi ĐỒNG THỜI ở đây (một
 * nhóm hằng số duy nhất cho FE; xem docs/UI.md).
 */
export const TDEE_MIN_KCAL = 1000
export const TDEE_MAX_KCAL = 6000

/** Dòng nhắc giới hạn (hiện khi ô còn trống, để thấy vì sao nút Lưu đang khoá). */
export const TDEE_BOUNDS_HINT = `Enter a whole number from ${TDEE_MIN_KCAL} to ${TDEE_MAX_KCAL} kcal.`

/** Ước tính TDEE hiện tại của BE khi mở ô Set TDEE: đang tải / lỗi tải / đã có (`kcal` null = BE chưa có ước tính). */
export interface TdeeEstimate {
  readonly status: 'loading' | 'error' | 'ready'
  readonly kcal: number | null
}

/** Phần của truy vấn `GET /expenditure/insights` mà ô Set TDEE cần. */
export interface InsightsQueryState {
  readonly data?: { readonly currentKcal?: number | null } | null
  readonly isError: boolean
  readonly isFetching: boolean
}

/**
 * Trạng thái ước tính cho ô Set TDEE. Chỉ tin số khi truy vấn ĐÃ tải xong và không lỗi: đang (tải lại) hoặc lỗi thì không đưa số cũ trong
 * bộ nhớ đệm vào ô — Lưu sẽ đặt thuật toán về đúng số đó, nên số có thể đã cũ (vd. vừa đặt TDEE xong) không được điền sẵn.
 */
export const tdeeEstimateOf = (query: InsightsQueryState): TdeeEstimate => {
  if (query.isError) return { status: 'error', kcal: null }
  if (!query.data || query.isFetching) return { status: 'loading', kcal: null }
  return { status: 'ready', kcal: query.data.currentKcal ?? null }
}

/**
 * Giá trị ban đầu của ô "Set TDEE": TDEE ƯỚC TÍNH HIỆN TẠI (cùng nguồn với trang Expenditure) làm tròn; chưa biết thì để TRỐNG — không bao
 * giờ dùng số mặc định, vì Lưu sẽ đặt lại thuật toán về đúng số đó.
 */
export const tdeeInitialValue = (currentKcal: number | null | undefined): string =>
  typeof currentKcal === 'number' && Number.isFinite(currentKcal) && currentKcal > 0
    ? String(Math.round(currentKcal))
    : ''

/**
 * Nội dung ô nhập: số người dùng đã gõ (`typed` khác null, kể cả chuỗi rỗng khi họ xoá) được giữ NGUYÊN; chưa gõ gì thì ô hiện ước tính của
 * BE — kể cả khi ước tính về SAU lúc mở bảng (không dựng lại ô nên không mất số đang gõ).
 */
export const tdeeSheetValue = (
  typed: string | null,
  currentKcal: number | null | undefined
): string => typed ?? tdeeInitialValue(currentKcal)

/** Câu giải thích nguồn của số trong ô: phân biệt đang tải, lỗi tải, chưa có ước tính và đã có. */
export function tdeeEstimateHint({ status, kcal }: TdeeEstimate): string {
  if (status === 'loading') return 'Reading your current estimate…'
  if (status === 'error') return 'We could not read your current estimate, so enter your TDEE.'
  if (kcal === null || !Number.isFinite(kcal) || kcal <= 0)
    return 'There is no estimate yet, so enter your TDEE.'
  return `Your current estimate is ${Math.round(kcal)} kcal.`
}

/** Thông báo lỗi của ô nhập (undefined = hợp lệ): bắt buộc nhập, là số nguyên và nằm trong khoảng của BE. */
export const tdeeError = (text: string): string | undefined => {
  const value = Number(text)
  return text.trim() !== '' &&
    Number.isInteger(value) &&
    value >= TDEE_MIN_KCAL &&
    value <= TDEE_MAX_KCAL
    ? undefined
    : TDEE_BOUNDS_HINT
}

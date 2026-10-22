/**
 * MỘT quy tắc cho mọi số "Remaining / left" (Daily Nutrition và Weekly Nutrition của Dashboard, tóm tắt macro và banner của Food Log, ô nutrient):
 * làm tròn "đã ăn" và "mục tiêu" ở đơn vị ĐANG HIỆN trước, rồi còn lại = mục tiêu − đã ăn. Nhờ vậy Consumed + Remaining = Target luôn cộng đúng ngay
 * trên màn hình và hai màn cho cùng một ngày không bao giờ ra hai đáp án (trước đây có nơi trừ trước rồi mới làm tròn: 2797 so với 2796 kcal).
 * Hàm thuần, không phụ thuộc gì: chạy được bằng `scripts/check-contract.mjs`.
 */

export interface ShownProgress {
  /** Đã ăn, đã làm tròn ở đơn vị đang hiện. */
  readonly consumed: number
  /** Mục tiêu đã làm tròn ở đơn vị đang hiện; null = chưa có mục tiêu (≤ 0 coi như chưa đặt, như `goal-progress`). */
  readonly goal: number | null
  /** Còn lại = goal − consumed (cả hai đã làm tròn); null khi chưa có mục tiêu. Mặc định không âm; `overages` thì giữ số âm khi vượt. */
  readonly remaining: number | null
}

/**
 * @param shown  đổi một số của BE (kcal, g…) sang đơn vị đang hiện VÀ làm tròn như màn hình đó ghi số (vd. `Math.round(energy.convert(v))`).
 * @param overages  true = hiện số âm khi vượt mục tiêu (cài đặt "Show Overages"); false = chặn ở 0.
 */
export function shownProgress(
  consumed: number,
  goal: number | null | undefined,
  shown: (value: number) => number,
  overages = false
): ShownProgress {
  const eaten = shown(consumed)
  if (goal === null || goal === undefined || goal <= 0)
    return { consumed: eaten, goal: null, remaining: null }
  const target = shown(goal)
  // Làm tròn 6 chữ số để phép trừ số thập phân (174.5 − 8.1) không để lại nhiễu dấu phẩy động
  const left = Math.round((target - eaten) * 1e6) / 1e6
  return { consumed: eaten, goal: target, remaining: overages ? left : Math.max(0, left) }
}

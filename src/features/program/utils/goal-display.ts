import { PROGRAM_GOAL_TYPE } from '@/config/enums'

/**
 * Hiển thị CHỈ-ĐỌC của một goal BE trả về (thẻ Goal và Goal History của tab Strategy). Nhãn lấy từ `PROGRAM_GOAL_TYPE` (đủ sáu loại của BE);
 * loại lạ (BE thêm sau) vẫn ra chữ chứ không `undefined`. Hàm thuần: chạy được bằng `scripts/check-contract.mjs`.
 */
const labels = PROGRAM_GOAL_TYPE as Readonly<Record<string, { short: string; title: string }>>

/** "Weight Loss Goal" / "Muscle Gain Goal"...: tiêu đề thẻ Goal. */
export const goalTitleOf = (goalType: string): string => labels[goalType]?.title ?? 'Goal'

/** "Loss" / "Muscle Gain"...: nhãn ngắn ở dòng Goal History. */
export const goalShortOf = (goalType: string): string => labels[goalType]?.short ?? goalType

/**
 * DẤU của tốc độ đổi cân, đọc từ CHÍNH SỐ BE gửi chứ không suy từ loại goal (Endurance / Flexibility chưa có hướng cố định, BE còn để ngỏ).
 * BE khác dấu giữa các trường, nên mỗi trường đọc theo quy ước riêng của nó: `weeklyWeightChangeTargetKg` ÂM = giảm, `weeklyWeightChangeTargetPercent`
 * DƯƠNG = giảm (preview / edit-preview thì dương = tăng). Bằng 0 thì không dấu, chỉ hiện độ lớn.
 */
export const kgRateSign = (weeklyWeightChangeTargetKg: number): '+' | '−' | '' =>
  weeklyWeightChangeTargetKg < 0 ? '−' : weeklyWeightChangeTargetKg > 0 ? '+' : ''

export const percentRateSign = (weeklyWeightChangeTargetPercent: number): '+' | '−' | '' =>
  weeklyWeightChangeTargetPercent > 0 ? '−' : weeklyWeightChangeTargetPercent < 0 ? '+' : ''

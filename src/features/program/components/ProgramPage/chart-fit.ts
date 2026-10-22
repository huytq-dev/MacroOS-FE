/**
 * Cỡ chữ của các ô trong biểu đồ bảy ngày (`WeekMacroChart`): tách khỏi `utils/day-macros.ts` (toán macro) vì đây chỉ là cách vẽ. Ở 320px mỗi cột chỉ ~31px nên
 * "2861", "326 C" hay số kJ năm chữ số tràn / xuống dòng nếu chữ cố định 14px; chữ co theo bề rộng cột để luôn nằm gọn MỘT dòng. Hàm thuần: `scripts/check-strategy.mjs` (S9).
 */
import { fitFontSize } from '@/lib/text-fit'

/** Bề rộng một chữ số có số tabular, tính bằng em (để ước lượng bề rộng chữ của một ô). */
const DIGIT_EM = 0.6
/** Phần chữ ngoài các chữ số của một ô macro ("175 P": khoảng trắng + chữ cái ≈ 0.95em) cộng khoảng chừa hai bên. */
export const MACRO_EXTRA_EM = 1.2
/** Viên calo chỉ có chữ số, chừa khoảng hai bên. */
export const KCAL_EXTRA_EM = 0.5

/** Cỡ chữ (CSS) của một ô: tối đa 14px, co theo bề rộng cột (`cqw` của `@container` bao quanh cột). */
export const cellFontSize = (digits: number, extraEm: number): string =>
  fitFontSize(digits, DIGIT_EM, extraEm, 0.875)

/**
 * Màu thanh và cách ghi số của một chất — dùng chung cho Dashboard, Nutrition, Overview, chi tiết món, plate, recipe và trang chi tiết
 * nutrient (trước đây mỗi nơi tự giữ một bản `MACRO_TONE` / `MACRO_BAR` / `format` / `formatAmount`).
 */

/** Lớp nền literal (Tailwind phải thấy nguyên chuỗi) của calo và bốn macro, theo bộ `--mf-tile-*`; chất khác dùng màu nhóm. */
export const MACRO_TONE: Readonly<Record<string, string>> = {
  calories: 'bg-mf-tile-calories',
  protein: 'bg-mf-tile-protein',
  fat: 'bg-mf-tile-fat',
  carbs: 'bg-mf-tile-carbs',
}

/** Màu thanh của một chất: calo / macro có màu riêng, còn lại lấy màu nhóm trong danh mục. */
export const nutrientTone = (key: string, groupTone: string): string => MACRO_TONE[key] ?? groupTone

/** "3258" / "53.4": kcal và số từ 100 trở lên làm tròn nguyên, còn lại một số lẻ (bỏ ".0"). */
export const formatAmount = (value: number, unit: string): string =>
  unit === 'kcal' || value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)

/** Chuỗi hiện cho một lượng chưa biết (BE chưa có dữ liệu chất đó): khác với 0. */
export const UNKNOWN_AMOUNT = '---'

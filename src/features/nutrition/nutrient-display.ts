/**
 * Màu thanh và cách ghi số của một chất — dùng chung cho Dashboard, Nutrition, Overview, chi tiết món, plate, recipe và trang chi tiết
 * nutrient (trước đây mỗi nơi tự giữ một bản `MACRO_TONE` / `MACRO_BAR` / `format` / `formatAmount`).
 */

import type { EnergyUnit, Measure } from '@/lib/units'

/** Lớp nền literal (Tailwind phải thấy nguyên chuỗi) của calo và bốn macro, theo bộ `--mf-tile-*`; chất khác dùng màu nhóm. */
export const MACRO_TONE: Readonly<Record<string, string>> = {
  calories: 'bg-mf-tile-calories',
  protein: 'bg-mf-tile-protein',
  fat: 'bg-mf-tile-fat',
  carbs: 'bg-mf-tile-carbs',
}

/** Màu thanh của một chất: calo / macro có màu riêng, còn lại lấy màu nhóm trong danh mục. */
export const nutrientTone = (key: string, groupTone: string): string => MACRO_TONE[key] ?? groupTone

/**
 * Số đã làm tròn đúng như `formatAmount` ghi: năng lượng (kcal / kJ) và số từ 100 trở lên nguyên, còn lại một số lẻ. Mọi phép "còn lại" làm tròn
 * bằng hàm này TRƯỚC khi trừ (`shownProgress`).
 */
export const roundAmount = (value: number, unit: string): number =>
  unit === 'kcal' || unit === 'kJ' || value >= 100 ? Math.round(value) : Math.round(value * 10) / 10

/** "3258" / "53.4": `roundAmount` dạng chuỗi (bỏ ".0"). */
export const formatAmount = (value: number, unit: string): string =>
  String(roundAmount(value, unit))

/**
 * Lượng một chất theo đơn vị HIỂN THỊ: calo (danh mục ghi 'kcal', số của BE là kcal) đổi sang kcal / kJ của user, chất khác (g, mg, mcg)
 * giữ nguyên. Gọi `formatAmount(display.value, display.unit)`.
 */
export const displayAmount = (value: number, unit: string, energy: Measure<EnergyUnit>) =>
  unit === 'kcal' ? { value: energy.convert(value), unit: energy.unit } : { value, unit }

/** Chuỗi hiện cho một lượng chưa biết (BE chưa có dữ liệu chất đó): khác với 0. */
export const UNKNOWN_AMOUNT = '---'

/**
 * Cỡ chữ co theo khung cho chữ không được tràn / xuống dòng. Hàm thuần trả về chuỗi CSS dùng `cqw` (1% bề rộng của `@container` bao quanh), nên khung càng hẹp
 * (320px) chữ càng nhỏ mà không cần đo bằng JS: ô biểu đồ bảy ngày của program (`cellFontSize`) và tên chất ở ô Dashboard (`wordFontSize`) dùng chung.
 * Kiểm tra: `scripts/check-strategy.mjs` (S9) và `scripts/check-contract.mjs` (V2).
 */

/** Bề rộng trung bình một chữ cái của font app, tính bằng em ("Monounsaturated" 15 chữ = 8.4em ở font-medium). */
const LETTER_EM = 0.57

/**
 * Cỡ chữ (CSS) để `chars` ký tự rộng `emPerChar` em (cộng `extraEm` chừa chỗ) nằm gọn MỘT dòng trong `@container` bao quanh: tối đa `maxRem`,
 * nhỏ dần khi khung hẹp.
 */
export const fitFontSize = (
  chars: number,
  emPerChar: number,
  extraEm: number,
  maxRem: number
): string => `min(${maxRem}rem, ${(100 / (chars * emPerChar + extraEm)).toFixed(2)}cqw)`

/**
 * Cỡ chữ của một tiêu đề cho phép xuống dòng giữa các từ nhưng không ngắt được TRONG một từ: từ dài nhất phải nằm gọn một dòng
 * ("Monounsaturated Fat" ở ô 134px, "Phenylalanine" ở ô 106px).
 */
export const wordFontSize = (text: string, maxRem: number): string =>
  fitFontSize(Math.max(1, ...text.split(/\s+/).map((word) => word.length)), LETTER_EM, 0, maxRem)

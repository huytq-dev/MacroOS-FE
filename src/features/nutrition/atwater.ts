/**
 * Calo mỗi gram (hệ số Atwater): MỘT nguồn cho mọi phép đổi gram ↔ kcal của macro (tính macro của program, chiều cao khối P / F / C, % calo từ mỗi macro, "Macro sum"
 * của Quick Add, câu giải thích ở màn Review). Cồn (7) chỉ Quick Add dùng cho dòng gợi ý vì BE không có trường riêng. Hằng số thuần, không phụ thuộc gì.
 */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9, alcohol: 7 } as const

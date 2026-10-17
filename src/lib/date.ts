// Ngày dạng yyyy-MM-dd theo giờ máy (BE nhận DateOnly). Chỉ gọi trong event/useEffect, không trong render (hydration).
export const toIsoDate = (date: Date): string => date.toLocaleDateString('sv')

export const todayIso = (): string => toIsoDate(new Date())

export const addDaysIso = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** yyyy-MM-dd → MM/dd/yyyy (kiểu Mỹ, giao diện tiếng Anh). Tên hàm giữ nguyên vì còn nhiều nơi gọi. */
export const formatDateVi = (iso: string): string => {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

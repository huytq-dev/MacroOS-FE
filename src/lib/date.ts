// Ngày dạng yyyy-MM-dd theo giờ máy (BE nhận DateOnly). Chỉ gọi trong event/useEffect, không trong render (hydration).
export const toIsoDate = (date: Date): string => date.toLocaleDateString('sv')

export const todayIso = (): string => toIsoDate(new Date())

export const addDaysIso = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export const formatDateVi = (iso: string): string => {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

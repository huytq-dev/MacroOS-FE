/** Các ngày hành kinh BE trả (`days`) dưới dạng Set để tra nhanh; BE đã gộp / tách khoảng nên FE không tự suy. */
export const periodDaySet = (days: readonly string[] | undefined) => new Set(days)

/** Các ngày hành kinh theo thứ tự mới → cũ (cho danh sách lịch sử). */
export const trackedDaysDesc = (days: ReadonlySet<string>) =>
  [...days].sort((a, b) => b.localeCompare(a))

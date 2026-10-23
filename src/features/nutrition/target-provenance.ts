/**
 * Nguồn gốc của target theo ngày do BE gắn (`targetProvenance`): VERIFIED = lấy từ snapshot đã kiểm chứng; LEGACY_UNVERIFIED = target cũ chỉ để THAM KHẢO,
 * không dùng cho kết luận đạt / không đạt; null = chưa có target. FE chỉ ĐỌC cờ này, không bao giờ tự suy ra.
 */
export type TargetProvenance = 'CURRENT_ACTIVE' | 'PLANNED' | 'VERIFIED' | 'LEGACY_UNVERIFIED'

/** Câu hiển thị ở mọi nơi có target chưa xác minh (Food Log, Nutrition History, Strategy, Analytics). */
export const UNVERIFIED_TARGET_NOTE = 'Historical target not verified'

/**
 * Ngày / tuần của Food Log có `target.targetProvenance` = LEGACY_UNVERIFIED: bỏ `target` (chỉ để tham khảo nên không vẽ đạt / không đạt, không tính còn lại / vượt)
 * và đặt `targetUnverified` để màn hiện "Historical target not verified". Cờ do BE gửi, FE không suy; ngày VERIFIED giữ nguyên.
 */
export function withoutUnverifiedTarget<
  T extends { logDate: string; target: { targetProvenance?: string | null } | null },
>(row: T, today: string | null): T & { targetUnverified?: boolean } {
  return isHistoricalUnverified(row.target?.targetProvenance, row.logDate, today)
    ? { ...row, target: null, targetUnverified: true }
    : row
}

/** true khi BE đánh dấu target là LEGACY_UNVERIFIED: không vẽ đạt / không đạt, không tính vào tỉ lệ đạt, streak hay huy hiệu. Chỉ đúng với giá trị đó, mã lạ / mới thì không. */
export const isUnverifiedTarget = (provenance: string | null | undefined): boolean =>
  provenance === 'LEGACY_UNVERIFIED'

/**
 * Chỉ target LỊCH SỬ (ngày < hôm nay theo múi giờ user) mới bị coi là chưa xác minh: target của hôm nay và tương lai là target đang áp dụng nên luôn hiện bình thường,
 * kể cả khi BE còn gắn LEGACY_UNVERIFIED cho tuần chạy từ trước S26. Chưa biết hôm nay (`null`) thì không ẩn gì.
 */
export const isHistoricalUnverified = (
  provenance: string | null | undefined,
  date: string,
  today: string | null
): boolean => today !== null && date < today && isUnverifiedTarget(provenance)

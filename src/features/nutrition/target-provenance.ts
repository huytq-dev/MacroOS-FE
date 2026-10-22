/**
 * Nguồn gốc của target theo ngày do BE gắn (`targetProvenance`): VERIFIED = lấy từ snapshot đã kiểm chứng; LEGACY_UNVERIFIED = target cũ chỉ để THAM KHẢO,
 * không dùng cho kết luận đạt / không đạt; null = chưa có target. FE chỉ ĐỌC cờ này, không bao giờ tự suy ra.
 */
export type TargetProvenance = 'VERIFIED' | 'LEGACY_UNVERIFIED'

/** Câu hiển thị ở mọi nơi có target chưa xác minh (Food Log, Nutrition History, Strategy, Analytics). */
export const UNVERIFIED_TARGET_NOTE = 'Historical target not verified'

/**
 * Ngày / tuần của Food Log có `target.targetProvenance` = LEGACY_UNVERIFIED: bỏ `target` (chỉ để tham khảo nên không vẽ đạt / không đạt, không tính còn lại / vượt)
 * và đặt `targetUnverified` để màn hiện "Historical target not verified". Cờ do BE gửi, FE không suy; ngày VERIFIED giữ nguyên.
 */
export function withoutUnverifiedTarget<
  T extends { target: { targetProvenance?: string | null } | null },
>(row: T): T & { targetUnverified?: boolean } {
  return isUnverifiedTarget(row.target?.targetProvenance)
    ? { ...row, target: null, targetUnverified: true }
    : row
}

/** true khi BE đánh dấu target là LEGACY_UNVERIFIED: không vẽ đạt / không đạt, không tính vào tỉ lệ đạt, streak hay huy hiệu. */
export const isUnverifiedTarget = (provenance: string | null | undefined): boolean =>
  provenance === 'LEGACY_UNVERIFIED'

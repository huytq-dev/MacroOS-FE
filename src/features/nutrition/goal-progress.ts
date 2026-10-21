/**
 * Mục tiêu dinh dưỡng và tiến độ so với mục tiêu — MỘT nơi duy nhất cho mọi thanh Floor / Target / Ceiling và mọi phần trăm
 * (Dashboard, Nutrition, Overview, chi tiết món, plate, recipe, trang chi tiết nutrient). Không phụ thuộc gì khác để chạy được bằng
 * `node scripts/check-goal-progress.mjs`.
 *
 * Quy tắc: floor / target / ceiling nằm trên CÙNG một thang thật; bố cục chỉ quyết định mốc neo (target, thiếu thì floor, chỉ trần thì
 * ceiling) nằm ở đâu trên thanh, trần xa hơn thang thì không vẽ (dải mở tới hết thanh) chứ KHÔNG kéo giãn thang. Số ≤ 0 hoặc null là
 * "không có" (target 0 coi như chưa đặt). `goalKind` của BE quyết định mốc nào được tính (xem `normalizeGoal`).
 */

/** Loại mục tiêu hiệu lực do BE phân loại (`GET /nutrients`, series, day, overview). */
export type GoalKind = 'Range' | 'Minimum' | 'Maximum' | 'Target' | 'TargetWithCeiling' | 'None'

export interface NutrientGoal {
  readonly floor: number | null
  readonly target: number | null
  readonly ceiling: number | null
  /** Loại mục tiêu BE trả; có thì quyết định mốc nào được vẽ, thiếu thì suy từ chính các số. */
  readonly goalKind?: GoalKind | null
}

export const NO_GOAL: NutrientGoal = { floor: null, target: null, ceiling: null }

/** Hai bố cục thanh, đo từ ảnh MacroFactor: `tile` (ô Dashboard) và `row` (hàng chất, thẻ macro, lịch sử, chi tiết món). */
export type GoalLayout = 'tile' | 'row'

/**
 * Vị trí (0–1 chiều dài thanh) của mốc neo (vạch target). Đo từ ảnh: ô Dashboard (Nutrient_Detail/01) vạch ở ~0.80 chiều dài thanh; hàng
 * chất, thẻ macro và lịch sử (Nutrient_Detail/03, 05, Food_Log/Add_Flow/3) vạch ở ~0.58.
 */
export const TARGET_AT: Readonly<Record<GoalLayout, number>> = { tile: 0.8, row: 0.58 }

export type GoalStatus = 'empty' | 'below' | 'inRange' | 'met' | 'over'

export interface GoalProgress {
  /** Giá trị ứng với đầu phải của thanh (chỉ giãn ra khi lượng đã ăn vượt thang); 0 khi không có mục tiêu. */
  readonly scaleMax: number
  /** Phần thanh đã tô (0–1). */
  readonly fill: number
  readonly floorAt: number | null
  readonly targetAt: number | null
  /** null khi không có trần HOẶC trần nằm ngoài thanh (không vẽ). */
  readonly ceilingAt: number | null
  /**
   * Dải mục tiêu (0–1) từ floor (thiếu thì target, thiếu nữa thì đầu thanh) tới ceiling; trần không có hoặc nằm ngoài thanh thì dải mở tới
   * hết thanh. null khi không có cả floor lẫn ceiling.
   */
  readonly zone: readonly [number, number] | null
  readonly status: GoalStatus
}

const positive = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

/**
 * Làm sạch một mục tiêu: số không dương thành null, rồi để `goalKind` (nếu có) quyết định mốc nào còn lại — None: không mốc nào;
 * Target: chỉ target; Maximum: chỉ ceiling; Minimum: không ceiling; TargetWithCeiling: không floor; Range: giữ cả ba.
 */
export function normalizeGoal(goal: Partial<NutrientGoal> | null | undefined): NutrientGoal {
  const floor = positive(goal?.floor)
  const target = positive(goal?.target)
  const ceiling = positive(goal?.ceiling)
  const goalKind = goal?.goalKind ?? null
  switch (goalKind) {
    case 'None':
      return { ...NO_GOAL, goalKind }
    case 'Target':
      return { floor: null, target, ceiling: null, goalKind }
    case 'Maximum':
      return { floor: null, target: null, ceiling, goalKind }
    case 'Minimum':
      return { floor, target, ceiling: null, goalKind }
    case 'TargetWithCeiling':
      return { floor: null, target, ceiling, goalKind }
    default:
      return { floor, target, ceiling, goalKind }
  }
}

/** Có ít nhất một mốc (floor / target / ceiling) dương: chất không có mục tiêu thì không vẽ thanh và hiện "No Target". */
export const hasGoal = (goal: Partial<NutrientGoal> | null | undefined): boolean => {
  const g = normalizeGoal(goal)
  return g.floor !== null || g.target !== null || g.ceiling !== null
}

/** Mốc dùng cho phần trăm và "còn lại": target, thiếu thì floor, chỉ trần thì ceiling (MỘT quy tắc cho mọi nơi; goalKind None = null). */
export function primaryGoal(goal: Partial<NutrientGoal> | null | undefined): number | null {
  const g = normalizeGoal(goal)
  return g.target ?? g.floor ?? g.ceiling
}

/**
 * Tính hình học và trạng thái của một thanh; `consumed` null hoặc ≤ 0 là thanh rỗng. QUY TẮC THANG (một nơi duy nhất): `scaleMax` được chọn
 * sao cho mốc neo (target, thiếu thì floor, chỉ trần thì ceiling) nằm ở vị trí của bố cục (`TARGET_AT`: row 0.58 / tile 0.80, đo từ ảnh MF);
 * mọi mốc và phần đã ăn đều ở vị trí = giá trị / scaleMax (tuyến tính, cùng một thang); đã ăn > scaleMax thì scaleMax = đã ăn. Phần
 * trăm (`goalPercent`) là consumed / mốc chính, TÁCH khỏi vị trí vạch. `anchorAt` chỉ để minh hoạ (Anatomy) đặt neo ở vị trí khác bố cục.
 */
export function goalProgress(
  goal: Partial<NutrientGoal> | null | undefined,
  consumed: number | null,
  layout: GoalLayout,
  anchorAt: number = TARGET_AT[layout]
): GoalProgress {
  const g = normalizeGoal(goal)
  const eaten = positive(consumed) ?? 0
  const anchor = g.target ?? g.floor ?? g.ceiling
  if (anchor === null)
    return {
      scaleMax: 0,
      fill: 0,
      floorAt: null,
      targetAt: null,
      ceilingAt: null,
      zone: null,
      status: 'empty',
    }

  // Thang theo mốc neo; trần xa hơn thì nằm ngoài thanh (không giãn thang), chỉ lượng đã ăn mới kéo thang ra
  let scaleMax = anchor / anchorAt
  if (eaten > scaleMax) scaleMax = eaten
  const at = (value: number | null) => (value === null ? null : Math.min(1, value / scaleMax))
  const floorAt = at(g.floor)
  const targetAt = at(g.target)
  const ceilingAt = g.ceiling !== null && g.ceiling <= scaleMax ? g.ceiling / scaleMax : null

  let status: GoalStatus
  if (eaten === 0) status = 'empty'
  else if (g.ceiling !== null && eaten > g.ceiling) status = 'over'
  else if (g.target !== null)
    status = eaten >= g.target ? 'met' : g.floor !== null && eaten >= g.floor ? 'inRange' : 'below'
  else if (g.floor !== null) status = eaten >= g.floor ? 'met' : 'below'
  else status = 'inRange'

  return {
    scaleMax,
    fill: eaten / scaleMax,
    floorAt,
    targetAt,
    ceilingAt,
    zone:
      g.floor === null && g.ceiling === null ? null : [floorAt ?? targetAt ?? 0, ceilingAt ?? 1],
    status,
  }
}

/** Phần trăm so với mốc chính (làm tròn); null khi chưa có số hoặc chưa có mục tiêu ("No Target"). */
export function goalPercent(
  goal: Partial<NutrientGoal> | null | undefined,
  consumed: number | null
): number | null {
  const reference = primaryGoal(goal)
  return reference === null || consumed === null ? null : Math.round((consumed / reference) * 100)
}

/** Còn lại tới mốc chính (không âm); null khi chưa có mục tiêu. */
export function goalRemaining(
  goal: Partial<NutrientGoal> | null | undefined,
  consumed: number | null
): number | null {
  const reference = primaryGoal(goal)
  return reference === null ? null : Math.max(0, reference - (consumed ?? 0))
}

/**
 * Chiều cao thanh một ô lưới Weekly Nutrition: Consumed = đã ăn / target (nắp vượt khi > target); Remaining = phần còn lại / target
 * (chưa ăn = đầy, ăn ≥ target = 0 → ô rỗng như MacroFactor). Không có target dương thì ô rỗng ở cả hai chế độ.
 */
export function weekBarProgress(
  consumed: number,
  target: number | null | undefined,
  mode: 'consumed' | 'remaining'
) {
  const goal = positive(target)
  if (goal === null) return { progress: 0, over: false }
  const eaten = Math.max(0, consumed)
  if (mode === 'remaining')
    return { progress: Math.min(1, Math.max(0, (goal - eaten) / goal)), over: false }
  return { progress: Math.min(1, eaten / goal), over: eaten > goal }
}

/**
 * Tỉ lệ đã ăn / target cho vòng, hàng tuần và thanh macro nhỏ (100% = target, như MacroFactor): `progress` kẹp 0–1, `over` khi vượt.
 * Target 0 / null mà đã ăn thì coi như đầy và vượt; chưa ăn thì 0.
 */
export function targetRatio(consumed: number, target: number | null | undefined) {
  const goal = positive(target)
  if (goal === null) return { progress: consumed > 0 ? 1 : 0, over: consumed > 0 }
  return { progress: Math.min(1, Math.max(0, consumed / goal)), over: consumed > goal }
}

/**
 * Mục tiêu dinh dưỡng và tiến độ so với mục tiêu — MỘT nơi duy nhất cho mọi thanh Floor / Target / Ceiling và mọi phần trăm
 * (Dashboard, Nutrition, Overview, chi tiết món, plate, recipe, trang chi tiết nutrient). Không phụ thuộc gì khác để chạy được bằng
 * `node scripts/check-goal-progress.mjs`.
 *
 * ADAPTIVE GOAL SCALE: thang của một thanh chỉ phụ thuộc vào CHÍNH mục tiêu (floor / target / ceiling theo `goalKind` của BE), không phụ
 * thuộc lượng đã ăn và không có vị trí target cố định: target nằm ở đâu là do thang tính ra (xem `goalScaleMax`). Số ≤ 0 hoặc null là
 * "không có" (target 0 coi như chưa đặt); không bịa mốc nào mà BE không trả.
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

// ── Hằng số của thang thích ứng (mỗi hệ số là "chừa bao nhiêu chỗ phía sau mốc cuối cùng của thanh") ────────────────────────────────

/** Chỉ có target (calo / macro theo program): thang = target × 1.25 → target ở 0.80 chiều dài thanh, còn 20% để thấy phần vượt nhẹ. */
export const TARGET_HEADROOM = 1.25
/** Có floor / target nhưng KHÔNG có trần (Minimum), hoặc trần quá xa để vẽ: thang = mốc × 1.5 → mốc ở ≈ 0.67, dư chỗ cho "ăn nhiều hơn mức tối thiểu". */
export const MIN_HEADROOM = 1.5
/** Chỉ có trần (Maximum, vd. saturated fat): thang = trần × 1.25 → trần ở 0.80; vượt trần là vượt thang, thanh đầy. */
export const LIMIT_HEADROOM = 1.25
/** Trần được vẽ trên thanh khi ceiling ≤ mốc cơ sở × hệ số này; xa hơn (vd. vitamin C 90 / 2000) thì không vẽ, ghi bằng chữ. */
export const CEILING_REACH = 2
/** Trần được vẽ: thang = ceiling × 1.15 → ceiling ở ≈ 0.87, floor / target phân bố tuyến tính trước đó. */
export const CEILING_HEADROOM = 1.15

export type GoalStatus = 'empty' | 'below' | 'inRange' | 'met' | 'over'

export interface GoalProgress {
  /** Giá trị ứng với đầu phải của thanh; 0 khi không có mục tiêu. KHÔNG đổi theo lượng đã ăn. */
  readonly scaleMax: number
  /** Phần thanh đã tô (0–1, kẹp ở 1 khi ăn vượt thang: thang không giãn ra). */
  readonly fill: number
  readonly floorAt: number | null
  readonly targetAt: number | null
  /** null khi không có trần HOẶC trần quá xa để vẽ (xem `ceilingOffScale`). */
  readonly ceilingAt: number | null
  /** Trần có thật nhưng quá xa mốc cơ sở nên không vẽ: nơi hiển thị ghi bằng chữ (vd. "Limit 2000 mg"). */
  readonly ceilingOffScale: boolean
  /** Giá trị trần (nếu có), để ghi chữ. */
  readonly ceilingValue: number | null
  /**
   * Dải mục tiêu (0–1) từ floor (thiếu thì target, thiếu nữa thì đầu thanh) tới ceiling; trần không có hoặc không vẽ thì dải mở tới hết
   * thanh. null khi không có cả floor lẫn ceiling.
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

/** Ceiling có được vẽ trên thanh không: có floor / target làm cơ sở và trần không xa hơn CEILING_REACH × cơ sở (chỉ-trần thì luôn vẽ). */
function ceilingDrawn(g: NutrientGoal): boolean {
  if (g.ceiling === null) return false
  const base = g.target ?? g.floor
  return base === null || g.ceiling <= base * CEILING_REACH
}

/**
 * Thang (giá trị ứng với đầu phải của thanh) cho MỘT mục tiêu; 0 khi không có mục tiêu (không vẽ thanh). Theo loại mục tiêu:
 * - chỉ target (Target): target × TARGET_HEADROOM; có floor nhưng không trần (Minimum): mốc × MIN_HEADROOM;
 * - chỉ trần (Maximum): ceiling × LIMIT_HEADROOM;
 * - có trần và floor / target (Range, TargetWithCeiling): trần gần (≤ CEILING_REACH × cơ sở) → ceiling × CEILING_HEADROOM, cả ba mốc nằm
 *   trên thanh; trần xa → mốc × MIN_HEADROOM và trần không vẽ.
 * Chỉ phụ thuộc mục tiêu: đổi lượng đã ăn không bao giờ đổi thang.
 */
export function goalScaleMax(goal: Partial<NutrientGoal> | null | undefined): number {
  const g = normalizeGoal(goal)
  const base = g.target ?? g.floor
  if (base === null) return g.ceiling === null ? 0 : g.ceiling * LIMIT_HEADROOM
  if (g.ceiling !== null)
    return ceilingDrawn(g) ? g.ceiling * CEILING_HEADROOM : base * MIN_HEADROOM
  // Không trần: chỉ target (kể cả goalKind Target) dùng TARGET_HEADROOM, có floor (Minimum) dùng MIN_HEADROOM
  return g.floor === null ? base * TARGET_HEADROOM : base * MIN_HEADROOM
}

/**
 * Hình học và trạng thái của một thanh. Vị trí của mọi mốc và của phần đã ăn = giá trị / scaleMax (kẹp 0–1, tuyến tính, cùng một thang);
 * ăn vượt thang thì fill = 1 chứ không giãn thang. `scaleMax` mặc định là thang của chính mục tiêu; danh sách nhiều hàng (lịch sử, tóm tắt)
 * truyền MỘT thang chung = max các thang để các hàng so sánh được. `consumed` null hoặc ≤ 0 là thanh rỗng. Phần trăm
 * (`goalPercent`) là consumed / mốc chính, TÁCH khỏi vị trí.
 */
export function goalProgress(
  goal: Partial<NutrientGoal> | null | undefined,
  consumed: number | null,
  scaleMax: number = goalScaleMax(goal)
): GoalProgress {
  const g = normalizeGoal(goal)
  const eaten = positive(consumed) ?? 0
  if (scaleMax <= 0)
    return {
      scaleMax: 0,
      fill: 0,
      floorAt: null,
      targetAt: null,
      ceilingAt: null,
      ceilingOffScale: false,
      ceilingValue: null,
      zone: null,
      status: 'empty',
    }

  const at = (value: number | null) =>
    value === null ? null : Math.min(1, Math.max(0, value / scaleMax))
  const floorAt = at(g.floor)
  const targetAt = at(g.target)
  const drawn = ceilingDrawn(g)
  const ceilingAt = drawn ? at(g.ceiling) : null

  let status: GoalStatus
  if (eaten === 0) status = 'empty'
  else if (g.ceiling !== null && eaten > g.ceiling) status = 'over'
  // Không có trần mà ăn vượt cả thang: thanh đầy và coi là vượt (có trần xa thì chỉ vượt khi qua trần thật)
  else if (g.ceiling === null && eaten > scaleMax) status = 'over'
  else if (g.target !== null)
    status = eaten >= g.target ? 'met' : g.floor !== null && eaten >= g.floor ? 'inRange' : 'below'
  else if (g.floor !== null) status = eaten >= g.floor ? 'met' : 'below'
  else status = 'inRange'

  return {
    scaleMax,
    fill: at(eaten) ?? 0,
    floorAt,
    targetAt,
    ceilingAt,
    ceilingOffScale: g.ceiling !== null && !drawn,
    ceilingValue: g.ceiling,
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

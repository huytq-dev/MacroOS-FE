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
  /** Loại mục tiêu BE phân loại (mọi model dinh dưỡng của BE đều có); quyết định mốc nào được vẽ. FE KHÔNG suy loại từ các con số. */
  readonly goalKind: GoalKind
}

export const NO_GOAL: NutrientGoal = { floor: null, target: null, ceiling: null, goalKind: 'None' }

/**
 * Mục tiêu từ một model dinh dưỡng của BE (`NutrientModel` của Dashboard, `NutrientAmountModel` của chi tiết món / plate / recipe,
 * `NutritionOverviewItem`...): đúng bốn trường BE trả, MỘT chỗ chung để mọi nơi vẽ thanh đi cùng đường với Dashboard.
 */
export const goalOfModel = (model: NutrientGoal): NutrientGoal => ({
  floor: model.floor,
  target: model.target,
  ceiling: model.ceiling,
  goalKind: model.goalKind,
})

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

/**
 * Trạng thái so với mục tiêu. Vượt có HAI loại khác hẳn nhau: `overTarget` chỉ là thông tin (ăn nhiều hơn target, vd. "112%": giữ tông
 * trung tính) còn `overCeiling` là cảnh báo (qua giới hạn thật của BE: tông destructive). Mục tiêu Minimum không có trạng thái vượt, và
 * "vượt" không bao giờ suy từ hằng số chừa chỗ để vẽ (`*_HEADROOM`) — chỉ từ mốc thật.
 */
export type GoalStatus = 'empty' | 'below' | 'inRange' | 'met' | 'overTarget' | 'overCeiling'

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
 * Làm sạch một mục tiêu: số không dương thành null, rồi để `goalKind` của BE quyết định mốc nào còn lại — None: không mốc nào;
 * Target: chỉ target; Maximum: chỉ ceiling; Minimum: không ceiling; TargetWithCeiling: không floor; Range: giữ cả ba. `goalKind` là
 * trường bắt buộc (BE luôn gửi), FE KHÔNG đoán loại từ các con số; không có mục tiêu (null / undefined) thì là `NO_GOAL`.
 */
export function normalizeGoal(goal: NutrientGoal | null | undefined): NutrientGoal {
  if (!goal) return NO_GOAL
  const floor = positive(goal.floor)
  const target = positive(goal.target)
  const ceiling = positive(goal.ceiling)
  const { goalKind } = goal
  switch (goalKind) {
    case 'None':
      return NO_GOAL
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
export const hasGoal = (goal: NutrientGoal | null | undefined): boolean => {
  const g = normalizeGoal(goal)
  return g.floor !== null || g.target !== null || g.ceiling !== null
}

/** Mốc dùng cho phần trăm và "còn lại": target, thiếu thì floor, chỉ trần thì ceiling (MỘT quy tắc cho mọi nơi; goalKind None = null). */
export function primaryGoal(goal: NutrientGoal | null | undefined): number | null {
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
 * Mốc cao nhất của MỘT mục tiêu mà biểu đồ lịch sử phải chừa chỗ (trục y): target, floor và trần GẦN (cùng luật `ceilingDrawn` với thanh).
 * Trần xa (vd. vitamin C 90 / 2000) không được tính — nếu tính thì cột dữ liệu bị ép xuống đáy — mà ghi bằng chữ "Limit …".
 */
export function goalAxisTop(goal: NutrientGoal | null | undefined): number {
  const g = normalizeGoal(goal)
  return Math.max(g.target ?? 0, g.floor ?? 0, ceilingDrawn(g) ? (g.ceiling ?? 0) : 0)
}

/**
 * Thang (giá trị ứng với đầu phải của thanh) cho MỘT mục tiêu; 0 khi không có mục tiêu (không vẽ thanh). Theo loại mục tiêu:
 * - chỉ target (Target): target × TARGET_HEADROOM; có floor nhưng không trần (Minimum): mốc × MIN_HEADROOM;
 * - chỉ trần (Maximum): ceiling × LIMIT_HEADROOM;
 * - có trần và floor / target (Range, TargetWithCeiling): trần gần (≤ CEILING_REACH × cơ sở) → ceiling × CEILING_HEADROOM, cả ba mốc nằm
 *   trên thanh; trần xa → mốc × MIN_HEADROOM và trần không vẽ.
 * Chỉ phụ thuộc mục tiêu: đổi lượng đã ăn không bao giờ đổi thang.
 */
export function goalScaleMax(goal: NutrientGoal | null | undefined): number {
  const g = normalizeGoal(goal)
  const base = g.target ?? g.floor
  if (base === null) return g.ceiling === null ? 0 : g.ceiling * LIMIT_HEADROOM
  if (g.ceiling !== null)
    return ceilingDrawn(g) ? g.ceiling * CEILING_HEADROOM : base * MIN_HEADROOM
  // Không trần: chỉ target (kể cả goalKind Target) dùng TARGET_HEADROOM, có floor (Minimum) dùng MIN_HEADROOM
  return g.floor === null ? base * TARGET_HEADROOM : base * MIN_HEADROOM
}

/** Mục tiêu Minimum (chỉ floor và/hoặc target, không trần): ăn nhiều hơn mức tối thiểu là điều tốt nên không có trạng thái vượt. Chỉ theo `goalKind` của BE. */
const isMinimum = (g: NutrientGoal) => g.goalKind === 'Minimum'

/**
 * Trạng thái của một lượng đã ăn so với mục tiêu đã làm sạch, chỉ theo các mốc THẬT: qua trần → `overCeiling`; qua target → `overTarget`
 * (trừ Minimum: `met`). Không phụ thuộc thang vẽ nên một thanh đầy không có nghĩa là vượt.
 */
function statusOf(g: NutrientGoal, eaten: number): GoalStatus {
  if (g.floor === null && g.target === null && g.ceiling === null) return 'empty'
  if (eaten === 0) return 'empty'
  if (g.ceiling !== null && eaten > g.ceiling) return 'overCeiling'
  if (g.target !== null) {
    if (eaten < g.target) return g.floor !== null && eaten >= g.floor ? 'inRange' : 'below'
    return eaten > g.target && !isMinimum(g) ? 'overTarget' : 'met'
  }
  if (g.floor !== null) return eaten >= g.floor ? 'met' : 'below'
  return 'inRange'
}

/** Trạng thái không cần hình học (chữ phần trăm, màu chữ...): cùng quy tắc với `goalProgress(...).status`. */
export function goalStatus(
  goal: NutrientGoal | null | undefined,
  consumed: number | null
): GoalStatus {
  return statusOf(normalizeGoal(goal), positive(consumed) ?? 0)
}

/**
 * Hình học và trạng thái của một thanh. Vị trí của mọi mốc và của phần đã ăn = giá trị / scaleMax (kẹp 0–1, tuyến tính, cùng một thang);
 * ăn vượt thang thì fill = 1 chứ không giãn thang. `scaleMax` mặc định là thang của chính mục tiêu; danh sách nhiều hàng (lịch sử, tóm tắt)
 * truyền MỘT thang chung = max các thang để các hàng so sánh được. `consumed` null hoặc ≤ 0 là thanh rỗng. Phần trăm
 * (`goalPercent`) là consumed / mốc chính, TÁCH khỏi vị trí.
 */
export function goalProgress(
  goal: NutrientGoal | null | undefined,
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
    status: statusOf(g, eaten),
  }
}

/** Phần trăm so với mốc chính (làm tròn); null khi chưa có số hoặc chưa có mục tiêu ("No Target"). */
export function goalPercent(
  goal: NutrientGoal | null | undefined,
  consumed: number | null
): number | null {
  const reference = primaryGoal(goal)
  return reference === null || consumed === null ? null : Math.round((consumed / reference) * 100)
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
 * Target 0 / null (không có mục tiêu) thì không có gì để vượt hay đầy: `{ progress: 0, over: false }`, không bịa trạng thái "vượt".
 */
export function targetRatio(consumed: number, target: number | null | undefined) {
  const goal = positive(target)
  if (goal === null) return { progress: 0, over: false }
  return { progress: Math.min(1, Math.max(0, consumed / goal)), over: consumed > goal }
}

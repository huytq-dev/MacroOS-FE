import { NUTRIENT_GROUPS } from './nutrient-catalog'

/** Ba trang "Tiêu điểm chính" của carousel, theo thứ tự mặc định. */
export type FocusKey = 'weekly' | 'energy' | 'daily'
/** Các nhóm ô có thể tuỳ chỉnh (sắp xếp nhóm, thêm/bớt ô, đổi thứ tự ô). */
export type SectionKey = 'insights' | 'habits' | 'bodyMetrics' | 'nutrition' | 'general'
/** Cách hiện số của một ô dinh dưỡng trên Dashboard. */
export type NutrientDisplay = 'percent' | 'consumed' | 'remaining'

export const FOCUS_KEYS: readonly FocusKey[] = ['weekly', 'energy', 'daily']
export const FOCUS_LABEL: Record<FocusKey, string> = {
  weekly: 'Weekly Nutrition',
  energy: 'Energy Balance',
  daily: 'Daily Nutrition',
}
export const NUTRIENT_DISPLAY_LABEL: Record<NutrientDisplay, string> = {
  percent: 'Percent',
  consumed: 'Consumed',
  remaining: 'Remaining',
}
export const NUTRIENT_DISPLAYS: readonly NutrientDisplay[] = ['percent', 'consumed', 'remaining']

/** Hình nhỏ ở đầu dòng ô trong màn tuỳ chỉnh. */
export type ThumbKind =
  | 'trendOrange'
  | 'trendPurple'
  | 'trendGreen'
  | 'bars'
  | 'goal'
  | 'dotsGreen'
  | 'dotsBlue'
  | 'photos'
  | 'ruler'
  | 'bar'
  | 'macros'
  | 'barsOrange'
  | 'dotsPink'

export interface TileDef {
  readonly key: string
  readonly label: string
  readonly thumb: ThumbKind
  /** Màu thanh (thumb `bar`). */
  readonly color?: string
}

export interface TileGroup {
  /** Tên nhóm trong bảng thêm/bớt; bỏ trống nếu chỉ có một nhóm. */
  readonly title?: string
  readonly tiles: readonly TileDef[]
}

export interface SectionDef {
  readonly key: SectionKey
  readonly title: string
  readonly editLabel: string
  /** Bảng thêm/bớt: tiêu đề (vd. "Nutrition") và nhóm. */
  readonly groups: readonly TileGroup[]
  /** Ô hiện sẵn, theo thứ tự. */
  readonly defaults: readonly string[]
  /** Mỗi ô có menu chọn cách hiện số (Phần trăm / Đã ăn / Còn lại). */
  readonly hasDisplayMode?: boolean
}

const t = (key: string, label: string, thumb: ThumbKind, color?: string): TileDef => ({
  key,
  label,
  thumb,
  color,
})
const measure = (key: string, label: string) => t(key, label, 'trendGreen')

const GROUP_COLOR: Record<string, string> = {
  carb: 'var(--mf-tile-carbs)',
  fat: 'var(--mf-tile-fat)',
  protein: 'var(--mf-tile-protein)',
  vitamins: '#a78bfa',
  minerals: '#fb7185',
  other: 'var(--mf-tile-calories)',
}
const MACRO_COLOR: Record<string, string> = {
  calories: 'var(--mf-tile-calories)',
  protein: 'var(--mf-tile-protein)',
  fat: 'var(--mf-tile-fat)',
  carbs: 'var(--mf-tile-carbs)',
}

const nutritionGroups: readonly TileGroup[] = NUTRIENT_GROUPS.map((group) => ({
  title: group.title,
  tiles: group.nutrients.map((nutrient) =>
    nutrient.key === 'macros'
      ? t(nutrient.key, nutrient.name, 'macros')
      : t(
          nutrient.key,
          nutrient.name,
          'bar',
          MACRO_COLOR[nutrient.key] ?? GROUP_COLOR[group.key] ?? 'var(--mf-tile-calories)'
        )
  ),
}))

export const SECTIONS: Record<SectionKey, SectionDef> = {
  insights: {
    key: 'insights',
    title: 'Insights & Analytics',
    editLabel: 'Add or Remove Insights',
    groups: [
      {
        tiles: [
          t('expenditure', 'Expenditure', 'trendOrange'),
          t('weightTrend', 'Weight Trend', 'trendPurple'),
          t('energyBalance', 'Energy Balance', 'bars'),
          t('goalProgress', 'Goal Progress', 'goal'),
        ],
      },
    ],
    defaults: ['expenditure', 'weightTrend'],
  },
  habits: {
    key: 'habits',
    title: 'Habits',
    editLabel: 'Add or Remove Habits',
    groups: [
      {
        tiles: [
          t('weighIn', 'Weigh-In', 'dotsGreen'),
          t('foodLogging', 'Food Logging', 'dotsBlue'),
        ],
      },
    ],
    defaults: ['weighIn', 'foodLogging'],
  },
  bodyMetrics: {
    key: 'bodyMetrics',
    title: 'Body Metrics',
    editLabel: 'Add or Remove Body Metrics',
    groups: [
      {
        title: 'Weight & Body Fat',
        tiles: [measure('scaleWeight', 'Scale Weight'), measure('bodyFat', 'Visual Body Fat')],
      },
      {
        title: 'Visual & Metric Overview',
        tiles: [
          t('progressPhotos', 'Progress Photos', 'photos'),
          t('fullBody', 'Full Body', 'ruler'),
        ],
      },
      {
        title: 'Upper Body',
        tiles: [
          measure('neck', 'Neck'),
          measure('shoulders', 'Shoulders'),
          measure('bust', 'Bust'),
          measure('chest', 'Chest'),
          measure('waist', 'Waist'),
          measure('hips', 'Hips'),
        ],
      },
      {
        title: 'Arms',
        tiles: [
          measure('bicepL', 'Left Bicep'),
          measure('bicepR', 'Right Bicep'),
          measure('forearmL', 'Left Forearm'),
          measure('forearmR', 'Right Forearm'),
          measure('wristL', 'Left Wrist'),
          measure('wristR', 'Right Wrist'),
        ],
      },
      {
        title: 'Legs',
        tiles: [
          measure('thighL', 'Left Thigh'),
          measure('thighR', 'Right Thigh'),
          measure('calfL', 'Left Calf'),
          measure('calfR', 'Right Calf'),
          measure('ankleL', 'Left Ankle'),
          measure('ankleR', 'Right Ankle'),
        ],
      },
      {
        title: 'Ratios',
        tiles: [measure('waistToHeight', 'Waist to Height'), measure('waistToHip', 'Waist to Hip')],
      },
    ],
    defaults: ['scaleWeight', 'bodyFat'],
  },
  nutrition: {
    key: 'nutrition',
    title: 'Nutrition',
    editLabel: 'Add or Remove Nutrients',
    groups: nutritionGroups,
    defaults: ['calories', 'protein', 'fat', 'carbs'],
    hasDisplayMode: true,
  },
  general: {
    key: 'general',
    title: 'General',
    editLabel: 'Add or Remove General Items',
    groups: [{ tiles: [t('steps', 'Steps', 'barsOrange'), t('period', 'Period', 'dotsPink')] }],
    defaults: ['steps', 'period'],
  },
}

export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[]

export interface DashboardLayout {
  /** Thứ tự cả ba trang tiêu điểm (kể cả trang đang ẩn). */
  readonly focus: readonly FocusKey[]
  readonly focusHidden: readonly FocusKey[]
  /** Thứ tự các nhóm ô. */
  readonly sections: readonly SectionKey[]
  /** Ô đang hiện của từng nhóm, theo thứ tự hiển thị. */
  readonly tiles: Readonly<Record<SectionKey, readonly string[]>>
  /** Cách hiện số của từng ô dinh dưỡng; thiếu = Đã ăn. */
  readonly nutrientDisplay: Readonly<Record<string, NutrientDisplay>>
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  focus: FOCUS_KEYS,
  focusHidden: [],
  sections: SECTION_KEYS,
  tiles: Object.fromEntries(SECTION_KEYS.map((key) => [key, SECTIONS[key].defaults])) as Record<
    SectionKey,
    readonly string[]
  >,
  nutrientDisplay: {},
}

const known = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
  Array.isArray(value) ? value.filter((item): item is T => allowed.includes(item as T)) : []

/** Làm sạch dữ liệu đọc từ storage: bỏ khoá lạ, bù khoá thiếu bằng mặc định (đổi danh sách ô không làm hỏng layout cũ). */
export function sanitizeLayout(raw: unknown): DashboardLayout {
  const data = (raw ?? {}) as Partial<Record<keyof DashboardLayout, unknown>>
  const focus = known(data.focus, FOCUS_KEYS)
  const sections = known(data.sections, SECTION_KEYS)
  const rawTiles = (data.tiles ?? {}) as Record<string, unknown>
  const tiles = {} as Record<SectionKey, readonly string[]>
  for (const key of SECTION_KEYS) {
    const allowed = SECTIONS[key].groups.flatMap((group) => group.tiles.map((tile) => tile.key))
    tiles[key] = Array.isArray(rawTiles[key])
      ? [...new Set(known(rawTiles[key], allowed))]
      : SECTIONS[key].defaults
  }
  const rawDisplay = (data.nutrientDisplay ?? {}) as Record<string, unknown>
  const nutrientDisplay: Record<string, NutrientDisplay> = {}
  for (const [key, value] of Object.entries(rawDisplay))
    if (NUTRIENT_DISPLAYS.includes(value as NutrientDisplay))
      nutrientDisplay[key] = value as NutrientDisplay
  return {
    focus: [...focus, ...FOCUS_KEYS.filter((key) => !focus.includes(key))],
    focusHidden: known(data.focusHidden, FOCUS_KEYS),
    sections: [...sections, ...SECTION_KEYS.filter((key) => !sections.includes(key))],
    tiles,
    nutrientDisplay,
  }
}

/** Đổi chỗ phần tử `index` với phần tử kế bên (delta = -1 lên, +1 xuống); ngoài biên thì giữ nguyên. */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return [...list]
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

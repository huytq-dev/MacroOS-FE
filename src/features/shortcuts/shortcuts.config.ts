import {
  Apple,
  BookOpen,
  Bookmark,
  Camera,
  CirclePlus,
  CookingPot,
  Ruler,
  ScanBarcode,
  Scale,
  Search,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { routePath } from '@/config/route-path'
import type {
  ShortcutColor,
  ShortcutConfig,
  ShortcutItem,
  ShortcutKey,
  ToolbarStyle,
} from './types/shortcuts.types'

export interface ShortcutMeta {
  readonly label: string
  readonly description: string
  readonly icon: LucideIcon
}

/** Nhãn, mô tả và icon của từng shortcut (BE chỉ giữ key + mặc định). */
export const SHORTCUT_CATALOG: Readonly<Record<ShortcutKey, ShortcutMeta>> = {
  search: { label: 'Search', description: 'Search for a food to log', icon: Search },
  barcode: { label: 'Barcode', description: 'Scan a food barcode', icon: ScanBarcode },
  ai: { label: 'AI', description: 'Log a meal from a photo or description', icon: Sparkles },
  weight: { label: 'Weight', description: 'Log your weight and body fat', icon: Scale },
  recipes: { label: 'Recipes', description: 'Open your recipes', icon: BookOpen },
  'quick-add': { label: 'Quick Add', description: 'Log Calories and macros directly', icon: Zap },
  photos: { label: 'Photos', description: 'Add progress photos', icon: Camera },
  metrics: { label: 'Metrics', description: 'Log body measurements', icon: Ruler },
  'your-foods': { label: 'Your Foods', description: 'Open the foods you created', icon: Apple },
  'new-recipe': { label: 'New Recipe', description: 'Create a recipe', icon: CookingPot },
  'new-food': { label: 'New Food', description: 'Create a custom food', icon: CirclePlus },
  favorites: { label: 'Favorites', description: 'Open your favorite foods', icon: Bookmark },
}

export const isShortcutKey = (key: string): key is ShortcutKey => key in SHORTCUT_CATALOG

/** Thông tin hiển thị của một khoá BE trả về; khoá lạ (BE thêm mà FE chưa biết) thì không có để UI bỏ qua. */
export const shortcutMeta = (key: string): ShortcutMeta | undefined =>
  isShortcutKey(key) ? SHORTCUT_CATALOG[key] : undefined

/** Shortcut chỉ điều hướng sang một trang: hiện bằng `<Link>` thay vì nút gọi `router.push`. */
export const SHORTCUT_HREF: Readonly<Partial<Record<ShortcutKey, string>>> = {
  'new-recipe': routePath.recipeNew,
  'new-food': routePath.foodNew,
}

export const shortcutHref = (key: string): string | undefined =>
  isShortcutKey(key) ? SHORTCUT_HREF[key] : undefined

/** Mặc định giống BE (hiện tới khi tải xong để không nháy): bật 8 mục đầu, tắt 4 mục cuối. */
const DEFAULT_KEYS: readonly ShortcutKey[] = [
  'search',
  'barcode',
  'ai',
  'weight',
  'recipes',
  'quick-add',
  'photos',
  'metrics',
  'your-foods',
  'new-recipe',
  'new-food',
  'favorites',
]
const DEFAULT_ENABLED = 8

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  toolbarStyle: 'SearchAndBarcode',
  isDefault: true,
  items: DEFAULT_KEYS.map((key, index): ShortcutItem => ({
    key,
    enabled: index < DEFAULT_ENABLED,
    color: null,
  })),
}

/** Bảy màu của Choose Color: nền ô icon + màu chữ/icon. */
export const SHORTCUT_COLORS: readonly {
  readonly value: ShortcutColor
  readonly label: string
  readonly className: string
}[] = [
  { value: 'red', label: 'Red', className: 'bg-shortcut-red text-white' },
  { value: 'orange', label: 'Orange', className: 'bg-shortcut-orange text-white' },
  { value: 'yellow', label: 'Yellow', className: 'bg-shortcut-yellow text-black' },
  { value: 'green', label: 'Green', className: 'bg-shortcut-green text-white' },
  { value: 'teal', label: 'Teal', className: 'bg-shortcut-teal text-white' },
  { value: 'blue', label: 'Blue', className: 'bg-shortcut-blue text-white' },
  { value: 'purple', label: 'Purple', className: 'bg-shortcut-purple text-white' },
]

/** Lớp CSS của ô icon shortcut: có màu thì màu đó, không thì nền xám mặc định. */
export const colorClass = (color: ShortcutColor | null): string =>
  SHORTCUT_COLORS.find((item) => item.value === color)?.className ?? 'bg-secondary text-foreground'

export const TOOLBAR_STYLES: readonly {
  readonly value: ToolbarStyle
  readonly label: string
  /** Số shortcut đang bật tối thiểu (BE từ chối nếu ít hơn). */
  readonly minEnabled: number
}[] = [
  { value: 'SearchAndBarcode', label: 'Search and Barcode', minEnabled: 1 },
  { value: 'SearchBarcodeCustom', label: 'Search, Barcode, and Custom', minEnabled: 3 },
  { value: 'FourCustom', label: 'Four Custom', minEnabled: 4 },
  { value: 'None', label: 'None', minEnabled: 1 },
]

/** Shortcut đang bật theo thứ tự; "Top Shortcut" là bốn mục đầu. */
export const enabledShortcuts = (config: ShortcutConfig): ShortcutItem[] =>
  config.items.filter((item) => item.enabled && isShortcutKey(item.key))

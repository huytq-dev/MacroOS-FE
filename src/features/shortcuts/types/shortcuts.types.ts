// Khớp BE GET/PUT /api/shortcuts (cấu hình thanh shortcut theo user)

export type ShortcutKey =
  | 'search'
  | 'barcode'
  | 'ai'
  | 'weight'
  | 'recipes'
  | 'quick-add'
  | 'photos'
  | 'metrics'
  | 'your-foods'
  | 'new-recipe'
  | 'new-food'
  | 'favorites'

export type ShortcutColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple'

export type ToolbarStyle = 'SearchAndBarcode' | 'SearchBarcodeCustom' | 'FourCustom' | 'None'

export interface ShortcutItem {
  key: string
  enabled: boolean
  /** null = không màu (icon thùng rác ở Choose Color). */
  color: ShortcutColor | null
}

export interface ShortcutConfig {
  toolbarStyle: ToolbarStyle
  /** Theo thứ tự user chọn, kể cả mục tắt; luôn đủ catalog. */
  items: ShortcutItem[]
  /** true = chưa lưu, đang dùng mặc định của BE. */
  isDefault: boolean
}

export type ShortcutSheetKind = 'weight' | 'metrics' | 'photos'

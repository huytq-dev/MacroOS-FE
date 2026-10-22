import type { NoteColor } from './types/food-log.types'

export const NOTE_NAME_MAX = 60
export const NOTE_TEXT_MAX = 1000
export const DEFAULT_NOTE_COLOR: NoteColor = 'Gray'

interface NoteColorDef {
  readonly value: NoteColor
  readonly label: string
  /** Chấm màu trong bảng chọn và ở góc thẻ ghi chú. */
  readonly dot: string
}

/** Bảy chấm theo thứ tự của MacroFactor (đỏ, xanh dương, xanh lá, vàng, tím, cam, xám = không màu); dùng token màu shortcut. */
export const NOTE_COLORS: readonly NoteColorDef[] = [
  { value: 'Red', label: 'Red', dot: 'bg-shortcut-red' },
  { value: 'Blue', label: 'Blue', dot: 'bg-shortcut-blue' },
  { value: 'Green', label: 'Green', dot: 'bg-shortcut-green' },
  { value: 'Yellow', label: 'Yellow', dot: 'bg-shortcut-yellow' },
  { value: 'Purple', label: 'Purple', dot: 'bg-shortcut-purple' },
  { value: 'Orange', label: 'Orange', dot: 'bg-shortcut-orange' },
  { value: 'Gray', label: 'No color', dot: 'bg-muted-foreground' },
]

export const noteColorOf = (color: NoteColor | null | undefined): NoteColorDef =>
  NOTE_COLORS.find((candidate) => candidate.value === color) ?? NOTE_COLORS[NOTE_COLORS.length - 1]

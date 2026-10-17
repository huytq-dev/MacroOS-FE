import type { MealType } from '@/config/enums'
import type { ProgramWeek } from '@/features/program/types/program.types'

// Khớp BE Contract/Models/FoodLogs/FoodLogModels.cs
export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

/** quantity = số khẩu phần nếu có foodServingId, ngược lại là gram. */
export interface FoodLogEntry {
  id: string
  mealType: MealType
  eatenAt: string | null
  foodItemId: string | null
  recipeId: string | null
  foodName: string
  foodServingId: string | null
  servingName: string | null
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  /** Biểu tượng emoji của món và tổng khối lượng (g); BE sẽ bổ sung, chưa có thì FE dùng mặc định / suy từ khẩu phần. */
  emoji?: string | null
  weightGrams?: number | null
}

// Khớp BE Contract/Models/FoodLogs/FoodLogModels.cs (WeekLogResponse)
export interface WeekDay {
  logDate: string
  totals: MacroTotals
  target: ProgramWeek | null
}

export interface WeekLog {
  days: WeekDay[]
}

/** Ghi chú trong ngày. BE đang đổi `notes` từ chuỗi sang mảng này (xem Docs/.../Food_Log/README.md mục 2.3). */
export interface FoodLogNote {
  id: string
  text: string
  /** Giờ gắn với ghi chú ("HH:mm:ss"), null nếu không có. */
  notedAt: string | null
}

/** Trạng thái đánh dấu ngày (BE sẽ trả; chưa có thì coi như Unmarked). */
export type DayStatus = 'Unmarked' | 'Complete' | 'Partial' | 'Fasting'

export interface DayLog {
  logDate: string
  /** Chấp nhận cả chuỗi (BE cũ) lẫn mảng (BE mới); dùng `toNotes` để chuẩn hoá. */
  notes: string | FoodLogNote[] | null
  isLogged?: boolean
  status?: DayStatus
  totals: MacroTotals
  target: ProgramWeek | null
  entries: FoodLogEntry[]
}

// Khớp BE Notes: POST /food-logs/notes, PUT /food-logs/notes/{id} (notedAt "HH:mm:ss" hoặc "HH:mm")
export interface AddNoteRequest {
  logDate: string
  text: string
  notedAt: string | null
}

export interface UpdateNoteRequest {
  text: string
  notedAt: string | null
}

// Khớp BE AddFoodLogEntryCommand
export interface AddEntryRequest {
  logDate: string
  mealType: MealType
  eatenAt: string | null
  foodItemId: string
  foodServingId: string | null
  quantity: number
}

// Khớp BE UpdateFoodLogEntryCommand
export interface UpdateEntryRequest {
  mealType: MealType
  eatenAt: string | null
  foodServingId: string | null
  quantity: number
}

// Khớp BE QuickAddCommand
export interface QuickAddRequest {
  logDate: string
  mealType: MealType
  eatenAt: string | null
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Khớp BE CopyFoodLogCommand (mealType null = cả ngày)
export interface CopyRequest {
  fromDate: string
  toDate: string
  mealType: MealType | null
  toMealType: MealType | null
}

/** Món chờ trong plate trước khi log. */
export interface PlateItem {
  key: string
  foodItemId: string
  name: string
  foodServingId: string | null
  servingLabel: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Chuẩn hoá `DayLog.notes` về mảng, bất kể BE cũ (chuỗi) hay mới (mảng). */
export const toNotes = (notes: DayLog['notes']): FoodLogNote[] =>
  Array.isArray(notes) ? notes : notes?.trim() ? [{ id: 'legacy', text: notes, notedAt: null }] : []

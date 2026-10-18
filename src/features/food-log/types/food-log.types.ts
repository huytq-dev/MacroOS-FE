import type { MealType } from '@/config/enums'
import type { NutrientAmount } from '@/features/foods/types/food.types'
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
  /** Khoá icon trong bộ icon món ăn (BE sẽ trả); có thì thay emoji bằng ảnh. */
  iconKey?: string | null
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

export interface DayLog {
  logDate: string
  /** Chấp nhận cả chuỗi (BE cũ) lẫn mảng (BE mới); dùng `toNotes` để chuẩn hoá. */
  notes: string | FoodLogNote[] | null
  isLogged?: boolean
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

// Khớp BE GET /nutrition/overview: value = tổng ngày (today) hoặc trung bình mỗi ngày đã log (các kỳ khác)
export interface NutritionOverviewItem {
  key: string
  value: number
  target: number | null
}

export interface NutritionOverviewResponse {
  range: string
  from: string
  to: string
  loggedDays: number
  items: NutritionOverviewItem[]
  /** Chỉ range=today: top 3 món cho calo/macro. */
  contributors: Partial<
    Record<'calories' | 'protein' | 'fat' | 'carbs', { name: string; value: number }[]>
  > | null
}

// Khớp BE AddFoodLogEntryCommand
export interface AddEntryRequest {
  logDate: string
  mealType: MealType
  eatenAt: string | null
  /** Dòng recipe chỉ gửi `recipeId` + `quantity` (số khẩu phần), không gửi foodItemId / foodServingId (BE trả 400). */
  foodItemId?: string
  foodServingId?: string | null
  recipeId?: string
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

// Khớp BE (đang thiết kế) POST /food-logs/ai/analyze: pha 1, chỉ tách món và nguyên liệu, chưa có dinh dưỡng
export interface AiIngredient {
  id: string
  name: string
  grams: number
}

export interface AiDish {
  id: string
  name: string
  ingredients: AiIngredient[]
}

export interface AiAnalyzeResponse {
  dishes: AiDish[]
  /** Mã lần phân tích, dùng cho `POST /food-logs/ai/confirm`; null = BE không lưu lần này (bỏ qua bước confirm). */
  scanId?: string | null
  /** BE luôn ước lượng nên true; confidence để hiện mức tin cậy nếu cần. */
  estimated?: boolean
  confidence?: 'low' | 'medium' | 'high'
}

// Khớp BE POST /food-logs/ai/confirm: báo món user đã chọn cho từng nguyên liệu AI (cần foodItemId hoặc canonicalFoodId)
export interface AiConfirmIngredient {
  /** Tên nguyên liệu do AI nhận ra (không phải tên món user chọn). */
  name: string
  foodItemId?: string
  canonicalFoodId?: string
}

export interface AiConfirmRequest {
  scanId: string
  ingredients: AiConfirmIngredient[]
}

// Pha 2: POST /food-logs/ai/resolve-ingredient, mỗi nguyên liệu một lần (gọi song song)
export interface ResolveIngredientRequest {
  name: string
  grams: number
}

/**
 * matched=true: món thật trong thư viện. matched=false + estimated=true: AI ước lượng đúng số gram (log bằng Quick Add).
 * matched=false + estimated=false: không tìm thấy và không ước lượng được (macro = 0), user tự nhập.
 */
export interface ResolvedIngredient {
  matched: boolean
  foodItemId: string | null
  foodName: string | null
  emoji: string | null
  /** Khoá icon của món khớp (BE sẽ trả). */
  iconKey?: string | null
  servingId?: string | null
  quantity: number
  unitLabel: string
  weightGrams: number
  calories: number
  protein: number
  fat: number
  carbs: number
  estimated?: boolean
}

/** Trạng thái riêng từng nguyên liệu ở pha 2. */
export type IngredientState =
  | { status: 'searching' }
  | { status: 'matched'; data: ResolvedIngredient }
  | { status: 'not-found' }
  | { status: 'error' }

// Khớp BE GET /library: món tự tạo hoặc recipe; số trên 1 khẩu phần (recipe: emoji và defaultServingId là null)
export interface LibraryItem {
  kind: 'Recipe' | 'Food'
  id: string
  name: string
  brand: string | null
  emoji: string | null
  /** Khoá icon của món (BE sẽ trả). */
  iconKey?: string | null
  defaultServingId: string | null
  servingName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  updatedAt: string
}

export interface LibraryParams {
  scope: 'All' | 'Foods' | 'Recipes'
  search?: string
  top?: number
  skip?: number
}

// Khớp BE CreateRecipeCommand (BE tự tính dinh dưỡng; quantity = số khẩu phần của món)
export interface CreateRecipeRequest {
  name: string
  servingsCount: number
  ingredients: { foodItemId: string; foodServingId: string; quantity: number }[]
}

/**
 * Khớp BE POST /food-logs/plate/nutrients. Dòng món: foodItemId + foodServingId (null = quantity là gram) + quantity. Dòng recipe:
 * recipeId + quantity (số khẩu phần, KHÔNG gửi foodServingId). Dòng ước lượng (không món): name + tổng calories/protein/carbs/fat.
 */
export interface PlateNutrientsItem {
  foodItemId?: string
  recipeId?: string
  foodServingId?: string | null
  quantity?: number
  name?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface PlateNutrientsRequest {
  date: string
  items: PlateNutrientsItem[]
}

/** `plate` = tổng riêng plate, `day` = đã log của ngày cộng plate; cả hai đủ chất core (amount null = chưa có dữ liệu). */
export interface PlateNutrientsResponse {
  date: string
  plate: NutrientAmount[]
  day: NutrientAmount[]
}

/** Món chờ trong plate trước khi log. foodItemId null: ước lượng của AI (log bằng Quick Add) hoặc recipe (có `recipeId`). */
export interface PlateItem {
  key: string
  foodItemId: string | null
  recipeId?: string
  name: string
  foodServingId: string | null
  servingLabel: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Emoji món (hiện ở Your Plate và viên thuốc plate); thiếu thì dùng 🍽️. */
  emoji?: string | null
  /** Khoá icon món (thay emoji khi có). */
  iconKey?: string | null
  /** Tổng khối lượng của dòng (g), nếu biết. */
  grams?: number
  /** Lượng các chất khác của dòng này (khoá danh mục dinh dưỡng → số theo đơn vị danh mục); món không có dữ liệu thì thiếu. */
  nutrients?: Readonly<Record<string, number>>
}

/** Chuẩn hoá `DayLog.notes` về mảng, bất kể BE cũ (chuỗi) hay mới (mảng). */
export const toNotes = (notes: DayLog['notes']): FoodLogNote[] =>
  Array.isArray(notes) ? notes : notes?.trim() ? [{ id: 'legacy', text: notes, notedAt: null }] : []

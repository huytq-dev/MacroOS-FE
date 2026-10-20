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
  /** Ngày có nhật ký (BE `IsLogged`); false thì không vẽ vòng kcal. */
  isLogged: boolean
  totals: MacroTotals
  target: ProgramWeek | null
}

export interface WeekLog {
  days: WeekDay[]
}

/** Màu ghi chú theo BE (chuỗi PascalCase, mặc định Gray = không màu). */
export type NoteColor = 'Gray' | 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Orange'

/** Ghi chú trong ngày. BE đang đổi `notes` từ chuỗi sang mảng này (xem Docs/.../Food_Log/README.md mục 2.3). */
export interface FoodLogNote {
  id: string
  /** Tên ghi chú ("Note Name", ≤ 60), tuỳ chọn; null nếu không có. */
  name?: string | null
  /** Màu ghi chú; thiếu = Gray. */
  color?: NoteColor | null
  text: string
  /** Giờ gắn với ghi chú ("HH:mm:ss"), null nếu không có. */
  notedAt: string | null
}

export interface DayLog {
  logDate: string
  /** Chấp nhận cả chuỗi (BE cũ) lẫn mảng (BE mới); dùng `toNotes` để chuẩn hoá. */
  notes: string | FoodLogNote[] | null
  /** Số ghi chú tối đa mỗi ngày (BE = 5) cho nhãn "n / 5"; thiếu thì dùng mặc định. */
  notesMaxPerDay?: number
  isLogged?: boolean
  totals: MacroTotals
  target: ProgramWeek | null
  entries: FoodLogEntry[]
}

// Khớp BE Notes: POST /food-logs/notes, PUT /food-logs/notes/{id} (notedAt "HH:mm:ss" hoặc "HH:mm")
/** Khớp BE POST /food-logs/entries/bulk-copy: copy nguyên snapshot sang `toDate`; `toTime` thiếu thì giữ giờ gốc của từng entry. */
export interface BulkCopyRequest {
  ids: string[]
  /** Một ngày đích; nhiều ngày thì dùng `toDates` (≤ 62, ids × ngày ≤ 1000). */
  toDate?: string
  toDates?: string[]
  /** HH:mm:ss. */
  toTime?: string
}

/** Khớp BE POST /food-logs/entries/bulk-move (cần ít nhất `toDate` hoặc `toTime`): giữ Id; chỉ `toTime` thì mỗi entry giữ ngày của mình. */
export interface BulkMoveRequest {
  ids: string[]
  toDate?: string
  toTime?: string
}

export interface AddNoteRequest {
  logDate: string
  /** Bắt buộc, ≤ 1000 ký tự. */
  text: string
  /** Tuỳ chọn, ≤ 60 ký tự; rỗng / null = không tên. */
  name: string | null
  color: NoteColor
  notedAt: string | null
}

export interface UpdateNoteRequest {
  text: string
  /** Chuỗi rỗng xoá tên; trường không gửi thì BE giữ cũ. */
  name: string
  color: NoteColor
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
/** Trạng thái chế biến AI nhận ra (BE: raw | boiled | fried | scrambled | grilled | steamed | baked | roasted | stir_fried). */
export type AiFoodState = string

export interface AiIngredient {
  id: string
  name: string
  grams: number
  /** Số lượng và đơn vị AI đọc từ ảnh/mô tả ("3" + "large"); thiếu = null (BE cũ hoặc AI không chắc). */
  quantity?: number | null
  unit?: string | null
  state?: AiFoodState | null
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
  /** State AI đã trả cho nguyên liệu này, để BE nhớ lựa chọn riêng theo state; không gửi = như cũ. */
  state?: AiFoodState | null
}

export interface AiConfirmRequest {
  scanId: string
  ingredients: AiConfirmIngredient[]
}

// Pha 2: POST /food-logs/ai/resolve-ingredient, mỗi nguyên liệu một lần (gọi song song)
export interface ResolveIngredientRequest {
  name: string
  grams: number
  /** Nguyên văn quantity/unit/state từ analyze; BE chọn khẩu phần theo cỡ AI nói (3 large) thay vì chỉ theo gram. */
  quantity?: number | null
  unit?: string | null
  state?: AiFoodState | null
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
  /** Nguồn khớp của BE: cache | canonical | variant | search | ai | none. */
  source?: string
  /** Các khẩu phần của món đã khớp (mặc định đứng đầu, rồi theo gram tăng dần, có cả "g"); null khi estimated hoặc không khớp. */
  servings?: ResolvedServing[] | null
}

/** Một khẩu phần trong `ResolvedIngredient.servings`; `label` đã bỏ tiền tố "1 " ("large", "100 g", "tbsp"). */
export interface ResolvedServing {
  id: string
  label: string
  gramsPerUnit: number
  isDefault: boolean
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
  /** `foodServingId` null = `quantity` là gram (BE giữ đúng số gram). */
  ingredients: RecipeIngredientRequest[]
  /** Tổng khối lượng sau nấu (g, 0.1–100000); không gửi = BE để null. */
  cookedYieldGrams?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  /** URL http(s) tuyệt đối ≤ 500 ký tự; ô Link của bước Preparation. */
  sourceUrl?: string
  description?: string
  /** BE đánh số lại 1..n theo thứ tự mảng. */
  steps?: { text: string }[]
  /** Khoá icon hợp lệ; thiếu = FE xếp chồng icon nguyên liệu. */
  iconKey?: string
}

export interface RecipeIngredientRequest {
  foodItemId: string
  foodServingId: string | null
  quantity: number
}

// Khớp BE POST /recipes/nutrients (chỉ đọc): cùng dạng dòng chất với plate/nutrients; perServing = total ÷ servingsCount
export interface RecipeNutrientsRequest {
  ingredients: RecipeIngredientRequest[]
  servingsCount?: number
  date?: string
}

export type RecipeMacros = Pick<MacroTotals, 'calories' | 'protein' | 'carbs' | 'fat'>

export interface RecipeNutrientsResponse {
  date: string
  totalGrams: number
  servingsCount: number
  total: RecipeMacros
  perServing: RecipeMacros
  totalNutrients: NutrientAmount[]
  perServingNutrients: NutrientAmount[]
}

// Khớp BE POST /recipes/create-and-log: bỏ `log` = hôm nay, giờ hiện tại, 1 khẩu phần
export interface CreateAndLogRequest {
  recipe: CreateRecipeRequest
  log?: { logDate?: string; mealType?: MealType; eatenAt?: string; quantity?: number }
}

export interface CreateAndLogResponse {
  recipeId: string
  entryId: string
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
export interface PlateServing {
  id: string
  name: string
  weightInGrams: number
}

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
  /** Các khẩu phần của món (chip đơn vị khi sửa lượng trong Your Plate); thiếu thì chỉ còn g / oz. */
  servings?: readonly PlateServing[]
  /** Lượng các chất khác của dòng này (khoá danh mục dinh dưỡng → số theo đơn vị danh mục); món không có dữ liệu thì thiếu. */
  nutrients?: Readonly<Record<string, number>>
}

/** Chuẩn hoá `DayLog.notes` về mảng, bất kể BE cũ (chuỗi) hay mới (mảng). */
export const toNotes = (notes: DayLog['notes']): FoodLogNote[] =>
  Array.isArray(notes) ? notes : notes?.trim() ? [{ id: 'legacy', text: notes, notedAt: null }] : []

import type { DayOfWeek, UnitSystem } from '@/config/enums'

/**
 * Đơn vị hiển thị của user — MỘT nơi duy nhất cho cân nặng (kg / lb) và năng lượng (kcal / kJ), cộng ngày đầu tuần (`lib/week.ts` dùng
 * `Units.weekStartDay`). BE luôn lưu và trả kg và kcal; FE chỉ đổi khi HIỂN THỊ và khi NHẬP (đổi đúng, không làm tròn trước khi tính),
 * rồi đổi ngược về kg / kcal trước khi gửi. Hàm thuần, không phụ thuộc React: chạy được bằng `scripts/check-contract.mjs`.
 */

/** Hằng số lb / kg cho MỌI nơi (trước đây có ba giá trị: 2.20462, 2.2046226 và 2.2). */
export const LB_PER_KG = 2.20462262
/** kJ trên mỗi kcal (nhiệt hoá học). */
export const KJ_PER_KCAL = 4.184
/** Gram trong một ounce / pound của KHỐI LƯỢNG MÓN ĂN (khác cân nặng cơ thể kg / lb ở trên): MỘT nguồn cho ô nhập Create Food, đơn vị khẩu phần Food Detail và đổi đơn vị nguyên liệu recipe. */
export const GRAMS_PER_OUNCE = 28.3495
export const GRAMS_PER_POUND = 453.592

export type WeightUnit = 'kg' | 'lb'
export type EnergyUnit = 'kcal' | 'kJ'
/** Giá trị của cài đặt năng lượng trong `GET / PUT /users/me`. */
export type EnergyUnitSetting = 'Kcal' | 'Kj'

export interface Units {
  readonly weight: WeightUnit
  readonly energy: EnergyUnit
  readonly weekStartDay: DayOfWeek
}

/** Mặc định của BE khi hồ sơ chưa có cài đặt: Metric, Kcal, Monday. */
const DEFAULT_UNITS: Units = { weight: 'kg', energy: 'kcal', weekStartDay: 'Monday' }

interface UnitSettings {
  readonly unitPreference?: UnitSystem | null
  readonly energyUnit?: EnergyUnitSetting | null
  readonly weekStartDay?: DayOfWeek | null
}

/** Đơn vị từ hồ sơ (`GET /users/me`); hồ sơ chưa tải xong hoặc thiếu trường thì dùng mặc định của BE. */
export const unitsOf = (profile: UnitSettings | null | undefined): Units => ({
  weight: profile?.unitPreference === 'Imperial' ? 'lb' : 'kg',
  energy: profile?.energyUnit === 'Kj' ? 'kJ' : 'kcal',
  weekStartDay: profile?.weekStartDay ?? DEFAULT_UNITS.weekStartDay,
})

export const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Một đại lượng (cân nặng hoặc năng lượng) ở đơn vị user chọn. `base` luôn là đơn vị của BE (kg, kcal), `shown` là số user thấy / gõ.
 * `convert` / `revert` đổi đúng, không làm tròn; chỉ `format` / `text` làm tròn, và chỉ để hiển thị.
 */
export interface Measure<U extends string> {
  readonly unit: U
  /** base → shown, đủ độ chính xác. */
  readonly convert: (base: number) => number
  /** shown → base, đủ độ chính xác (làm tròn khi gửi là việc của chỗ gửi: `toApiKg`, `toApiKcal`). */
  readonly revert: (shown: number) => number
  /** Số đã đổi, làm tròn `digits` chữ số thập phân để HIỂN THỊ; null / undefined → "—". */
  readonly format: (base: number | null | undefined, digits?: number) => string
  /** `format` kèm đơn vị: "174.8 lb", "10000 kJ" (không có dấu ngăn cách nghìn, như phần còn lại của app). */
  readonly text: (base: number | null | undefined, digits?: number) => string
}

const known = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value)

const measure = <U extends string>(unit: U, perBase: number, defaultDigits: number): Measure<U> => {
  const format = (base: number | null | undefined, digits = defaultDigits) =>
    known(base) ? (base * perBase).toFixed(digits) : '—'
  return {
    unit,
    convert: (base) => base * perBase,
    revert: (shown) => shown / perBase,
    format,
    text: (base, digits) => (known(base) ? `${format(base, digits)} ${unit}` : '—'),
  }
}

const KG: Measure<WeightUnit> = measure('kg', 1, 1)
const LB: Measure<WeightUnit> = measure('lb', LB_PER_KG, 1)
const KCAL: Measure<EnergyUnit> = measure('kcal', 1, 0)
const KJ: Measure<EnergyUnit> = measure('kJ', KJ_PER_KCAL, 0)

export const weightMeasure = (unit: WeightUnit): Measure<WeightUnit> => (unit === 'lb' ? LB : KG)
export const energyMeasure = (unit: EnergyUnit): Measure<EnergyUnit> => (unit === 'kJ' ? KJ : KCAL)

/** Số kg gửi BE từ số user nhập theo `unit`: đổi đúng rồi chỉ làm tròn 2 chữ số (BE lưu kg 2 chữ số), KHÔNG làm tròn trước khi đổi. */
export const toApiKg = (shown: number, unit: WeightUnit): number =>
  roundTo(weightMeasure(unit).revert(shown), 2)

/**
 * Số kg gửi BE khi user lưu một lần cân ĐÃ CÓ: nếu số họ thấy (làm tròn 1 chữ số như ô nhập) chưa đổi so với số đã lưu thì GỬI LẠI số kg đã lưu (đổi lb về kg rồi
 * làm tròn 2 chữ số sẽ làm số đã lưu lệch dù user chưa sửa gì, vd. chỉ sửa % mỡ); đổi rồi thì quy đổi đúng số vừa nhập (`toApiKg`). MỘT hàm cho mọi nơi sửa cân.
 */
export const kgToSend = (
  typed: number,
  unit: WeightUnit,
  storedKg: number | null | undefined
): number =>
  storedKg !== null &&
  storedKg !== undefined &&
  typed === roundTo(weightMeasure(unit).convert(storedKg), 1)
    ? storedKg
    : toApiKg(typed, unit)

/**
 * Số kcal gửi BE từ số user nhập theo `unit` (kJ ÷ 4.184), làm tròn `digits` chữ số thập phân: mặc định số nguyên kcal (TDEE, sàn calo...), Quick Add gửi 0.1 kcal
 * (`digits` = 1; BE nhận decimal 0–10000).
 */
export const toApiKcal = (shown: number, unit: EnergyUnit, digits = 0): number =>
  roundTo(energyMeasure(unit).revert(shown), digits)

/**
 * Số năng lượng đang gõ (chuỗi) đổi sang đơn vị khác sao cho năng lượng thực không đổi, làm tròn số nguyên như ô nhập; ô trống hoặc chưa phải số thì giữ
 * nguyên chuỗi. Quick Add dùng khi user đổi kcal ↔ kJ và khi hồ sơ tải xong sau lần render đầu.
 */
export const convertEnergyText = (text: string, from: EnergyUnit, to: EnergyUnit): string =>
  from === to || text.trim() === '' || Number.isNaN(Number(text))
    ? text
    : String(Math.round(energyMeasure(to).convert(energyMeasure(from).revert(Number(text)))))

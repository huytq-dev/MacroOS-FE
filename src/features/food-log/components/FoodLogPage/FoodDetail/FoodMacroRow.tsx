import { cn } from '@/lib/utils'

interface FoodMacroRowProps {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
  /** % calo đến từ từng macro (pill phía trên mỗi cột). */
  readonly shares: { readonly protein: number; readonly fat: number; readonly carbs: number }
}

const MACROS = [
  { key: 'protein', label: 'Protein', pill: 'bg-mf-tile-protein/20 text-mf-tile-protein' },
  { key: 'fat', label: 'Fat', pill: 'bg-mf-tile-fat/20 text-mf-tile-fat' },
  { key: 'carbs', label: 'Carbs', pill: 'bg-mf-tile-carbs/20 text-mf-tile-carbs' },
] as const

/** Luôn một số lẻ như MacroFactor ("10.0", "0.0", "30.8"). */
const oneDecimal = (value: number) => value.toFixed(1)

/** Hàng tổng: calo lớn bên trái, ba cột Protein / Fat / Carbs bên phải, mỗi cột có pill % calo của macro đó. */
export function FoodMacroRow({ calories, protein, fat, carbs, shares }: FoodMacroRowProps) {
  const values = { protein, fat, carbs }
  return (
    <div className="flex items-end justify-between gap-4 py-5">
      <div>
        <p className="font-display text-[40px] leading-none font-extrabold tabular-nums">
          {Math.round(calories)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">Calories</p>
      </div>
      <dl className="ml-6 grid flex-1 grid-cols-3 text-center">
        {MACROS.map((macro) => (
          <div key={macro.key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'rounded-full px-3 py-0.5 text-sm font-semibold tabular-nums',
                macro.pill
              )}
            >
              {shares[macro.key]}%
            </span>
            <dd className="text-2xl leading-none font-semibold tabular-nums">
              {oneDecimal(values[macro.key])}
            </dd>
            <dt className="text-muted-foreground text-sm">{macro.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

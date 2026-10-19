'use client'

import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ChoiceSheet } from '../FoodLogSettingsPage'

/** id của form: nút "Quick Add" nằm ở thanh đáy AddFoodDialog (ngoài form) gửi form qua thuộc tính `form`. */
export const QUICK_ADD_FORM_ID = 'quick-add-form'

const UNIT_CHOICES = [
  { value: 'kcal', label: 'kcal' },
  { value: 'kJ', label: 'kJ' },
] as const

export interface QuickAddValues {
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

type EnergyUnit = 'kcal' | 'kJ'

const KJ_PER_KCAL = 4.184
/** Calo mỗi gram: đạm 4, bột đường 4, béo 9, cồn 7 (dòng "Macro sum"). */
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9, alcohol: 7 } as const
const LIMITS = { calories: 10000, macro: 1000 } as const

interface QuickAddPanelProps {
  /** Thêm vào plate (chưa ghi vào nhật ký): bấm "Log Foods" ở đáy bảng để ghi. */
  readonly onAdd: (values: QuickAddValues) => void
}

const toNumber = (text: string) => (text.trim() === '' ? 0 : Number(text))
const outOfRange = (text: string, max: number) =>
  text.trim() !== '' && !(Number(text) >= 0 && Number(text) <= max)

/** Ô nhập số có hậu tố đơn vị nằm trong ô (g), nhãn 16px phía trên. */
function GramField({
  label,
  value,
  onChange,
  invalid,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (next: string) => void
  readonly invalid: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-base">{label}</span>
      <span className="relative block">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-lg pr-8 text-base tabular-nums"
        />
        <span
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-base"
        >
          g
        </span>
      </span>
    </label>
  )
}

/**
 * Tab Quick Add (kiểu MacroFactor): Energy với đơn vị kcal/kJ, dòng gợi ý "Macro sum is N kcal" tính từ đạm/béo/bột đường/cồn,
 * ba ô Protein / Fat / Carbs cạnh nhau, ô Alcohol, tên món tuỳ chọn. Nút "Quick Add" thêm vào plate (không ghi ngay); ghi vào
 * nhật ký bằng "Log Foods". Cồn chỉ dùng cho dòng gợi ý (BE không có trường riêng). Khớp BE: kcal 0–10000, macro 0–1000.
 */
export function QuickAddPanel({ onAdd }: QuickAddPanelProps) {
  const [unit, setUnit] = useState<EnergyUnit>('kcal')
  const [unitOpen, setUnitOpen] = useState(false)
  const energyRef = useRef<HTMLInputElement>(null)
  const [energy, setEnergy] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [alcohol, setAlcohol] = useState('')
  const [name, setName] = useState('')

  const macroKcal = Math.round(
    toNumber(protein) * KCAL_PER_GRAM.protein +
      toNumber(carbs) * KCAL_PER_GRAM.carbs +
      toNumber(fat) * KCAL_PER_GRAM.fat +
      toNumber(alcohol) * KCAL_PER_GRAM.alcohol
  )
  const macroSum = unit === 'kcal' ? macroKcal : Math.round(macroKcal * KJ_PER_KCAL)
  const kcal = unit === 'kcal' ? toNumber(energy) : toNumber(energy) / KJ_PER_KCAL
  const invalid = {
    energy: outOfRange(energy, unit === 'kcal' ? LIMITS.calories : LIMITS.calories * KJ_PER_KCAL),
    protein: outOfRange(protein, LIMITS.macro),
    fat: outOfRange(fat, LIMITS.macro),
    carbs: outOfRange(carbs, LIMITS.macro),
    alcohol: outOfRange(alcohol, LIMITS.macro),
  }
  const hasEnergy = energy.trim() !== '' && toNumber(energy) > 0
  const valid = hasEnergy && !Object.values(invalid).some(Boolean)

  /** Đổi đơn vị thì quy đổi số đang nhập để năng lượng thực không đổi. */
  const changeUnit = (next: EnergyUnit) => {
    if (next === unit) return
    if (energy.trim() !== '' && !Number.isNaN(Number(energy))) {
      const value = next === 'kJ' ? Number(energy) * KJ_PER_KCAL : Number(energy) / KJ_PER_KCAL
      setEnergy(String(Math.round(value)))
    }
    setUnit(next)
  }

  const reset = () => {
    setEnergy('')
    setProtein('')
    setFat('')
    setCarbs('')
    setAlcohol('')
    setName('')
  }

  return (
    <form
      id={QUICK_ADD_FORM_ID}
      noValidate
      className="space-y-5 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid) {
          energyRef.current?.focus()
          return
        }
        onAdd({
          name: name.trim() || null,
          calories: Math.round(kcal * 10) / 10,
          protein: toNumber(protein),
          carbs: toNumber(carbs),
          fat: toNumber(fat),
        })
        reset()
      }}
    >
      <div className="space-y-2">
        <label htmlFor="quick-add-energy" className="block text-base">
          Energy
        </label>
        <div className="flex gap-3">
          <Input
            ref={energyRef}
            id="quick-add-energy"
            autoFocus
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={energy}
            aria-invalid={invalid.energy || undefined}
            onChange={(event) => setEnergy(event.target.value)}
            className="h-12 flex-1 rounded-lg text-base tabular-nums"
          />
          <button
            type="button"
            aria-label={`Energy unit: ${unit}`}
            aria-haspopup="dialog"
            onClick={() => setUnitOpen(true)}
            className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-12 w-28 shrink-0 items-center justify-between rounded-lg px-4 text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
          >
            {unit}
            <ChevronDown aria-hidden="true" className="text-muted-foreground size-4" />
          </button>
        </div>
        <ChoiceSheet
          open={unitOpen}
          onOpenChange={setUnitOpen}
          title="Unit"
          choices={UNIT_CHOICES}
          value={unit}
          onSelect={(next) => changeUnit(next as EnergyUnit)}
        />
        <p className="text-muted-foreground text-sm">
          Macro sum is {macroSum} {unit}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GramField
          label="Protein"
          value={protein}
          onChange={setProtein}
          invalid={invalid.protein}
        />
        <GramField label="Fat" value={fat} onChange={setFat} invalid={invalid.fat} />
        <GramField label="Carbs" value={carbs} onChange={setCarbs} invalid={invalid.carbs} />
      </div>

      <GramField label="Alcohol" value={alcohol} onChange={setAlcohol} invalid={invalid.alcohol} />

      <label className="block space-y-2">
        <span className="text-base">
          Name <span className="text-muted-foreground text-sm">Optional</span>
        </span>
        <Input
          value={name}
          maxLength={256}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-lg text-base"
        />
      </label>
    </form>
  )
}

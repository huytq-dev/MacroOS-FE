'use client'

import { PickerSelect } from '@/components/shared/PickerSelect'
import { cn } from '@/lib/utils'
import {
  NUTRIENT_ROWS,
  TABLE_GROUPS,
  TABLE_MODES,
  type NutrientRowDef,
  type TableMode,
} from '../../create-food.config'
import { basisLabel, type CreateFoodState, type FieldErrors } from '../../create-food.utils'
import { SlidingSwitch } from '../FoodLogPage/SlidingSwitch'
import { FieldError } from './field'

interface NutritionSectionProps {
  readonly state: CreateFoodState
  readonly errors: FieldErrors
  readonly onModeChange: (mode: TableMode) => void
  readonly onValue: (key: string, text: string) => void
  readonly onUnit: (key: string, label: string) => void
}

interface NutrientRowProps {
  readonly def: NutrientRowDef
  readonly value: string
  readonly unit: string | undefined
  readonly error: string | undefined
  readonly onValue: (text: string) => void
  readonly onUnit: (label: string) => void
}

/** Một hàng của bảng: nhãn bên trái (hàng có đơn vị phụ thì kèm ô chọn đơn vị), ô số căn phải, "optional" khi chưa nhập. */
function NutrientRow({ def, value, unit, error, onValue, onUnit }: NutrientRowProps) {
  const id = `nutrient-${def.key}`
  return (
    <li className="border-border/70 border-b last:border-b-0">
      <div className={cn('flex min-h-14 items-center gap-3', def.indent ? 'pl-6' : 'pl-1')}>
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 text-base',
            def.required && 'font-semibold',
            def.indent && 'text-foreground/90'
          )}
        >
          {def.alt ? (
            <>
              <label htmlFor={id}>{def.shortLabel}</label>
              <PickerSelect
                aria-label={`${def.shortLabel} unit`}
                title={`${def.shortLabel} Unit`}
                options={def.alt.map((option) => ({ value: option.label, label: option.label }))}
                value={unit ?? def.alt[0].label}
                onValueChange={onUnit}
                // Viên gọn 36px trong hàng bảng, vùng chạm vẫn 44px nhờ before
                className="md:bg-secondary relative h-9 w-auto gap-1 rounded-full px-3 text-sm font-normal before:absolute before:-inset-1 before:content-[''] md:h-9 md:rounded-full md:border-transparent md:px-3 md:text-sm"
              />
            </>
          ) : (
            <label htmlFor={id} className="truncate">
              {def.label}
            </label>
          )}
        </div>
        <input
          id={id}
          value={value}
          inputMode="decimal"
          autoComplete="off"
          placeholder={def.required ? 'required' : 'optional'}
          aria-invalid={Boolean(error)}
          onChange={(event) => onValue(event.target.value)}
          className={cn(
            'placeholder:text-muted-foreground/60 h-12 w-32 shrink-0 bg-transparent pr-1 text-right text-base tabular-nums outline-none',
            error && 'text-destructive placeholder:text-destructive/70'
          )}
        />
      </div>
      <FieldError message={error} className="pr-1 pb-2 text-right" />
    </li>
  )
}

/**
 * "Nutrition Information": thanh chọn kiểu bảng (US Label | Non-US | Food Detail) và bảng chất theo cơ sở đã chọn ở phần Serving.
 * Tiêu đề bảng là thanh trắng "Nutrition … per 1.0 <khẩu phần> (<gam>)"; các nhóm cách nhau bằng đường trắng đậm như nhãn thật.
 */
export function NutritionSection({
  state,
  errors,
  onModeChange,
  onValue,
  onUnit,
}: NutritionSectionProps) {
  const groups = TABLE_GROUPS[state.mode]
  return (
    <section aria-labelledby="create-nutrition" className="space-y-5">
      <h2 id="create-nutrition" className="text-xl font-bold">
        Nutrition Information
      </h2>
      <SlidingSwitch
        variant="block"
        options={TABLE_MODES}
        value={state.mode}
        onChange={onModeChange}
        label="Nutrition table layout"
        className="bg-secondary"
      />

      <div>
        <div className="bg-foreground text-background flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm font-semibold">
          <span>Nutrition</span>
          <span className="min-w-0 truncate text-right">{basisLabel(state)}</span>
        </div>
        {groups.map((group, groupIndex) => (
          <div
            key={group.title ?? `group-${groupIndex}`}
            className={cn(groupIndex < groups.length - 1 && 'border-foreground border-b-2')}
          >
            {group.title && <h3 className="px-1 pt-5 pb-1 text-sm font-semibold">{group.title}</h3>}
            <ul>
              {group.keys.map((key) => {
                // Non-US: đường trắng đậm ngay sau dòng Energy như ảnh
                const thick = state.mode === 'non-us' && key === 'calories'
                return (
                  <div key={key} className={cn(thick && 'border-foreground border-b-2')}>
                    <NutrientRow
                      def={NUTRIENT_ROWS[key]}
                      value={state.values[key] ?? ''}
                      unit={state.units[key]}
                      error={errors[key]}
                      onValue={(text) => onValue(key, text)}
                      onUnit={(label) => onUnit(key, label)}
                    />
                  </div>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

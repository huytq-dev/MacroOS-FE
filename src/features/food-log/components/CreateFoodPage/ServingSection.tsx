'use client'

import { PickerSelect } from '@/components/shared/PickerSelect'
import { BASIS_OPTIONS, WEIGHT_UNITS, type Basis } from '../../create-food.config'
import type { CreateFoodState, FieldErrors } from '../../create-food.utils'
import { SlidingSwitch } from '../FoodLogPage/SlidingSwitch'
import { FIELD_CLASS, FieldError, FieldLabel } from './field'

interface ServingSectionProps {
  readonly state: Pick<
    CreateFoodState,
    'basis' | 'weight' | 'weightUnit' | 'servingQty' | 'servingName'
  >
  readonly errors: FieldErrors
  readonly onBasisChange: (basis: Basis) => void
  readonly onChange: (
    partial: Partial<Pick<CreateFoodState, 'weight' | 'weightUnit' | 'servingQty' | 'servingName'>>
  ) => void
}

const HELP = 'text-muted-foreground pt-2 text-sm leading-snug'

/**
 * "Serving Information": chọn cơ sở của số liệu dinh dưỡng (Serving | 100 g | 100 ml). Cơ sở Serving hỏi khối lượng và kích thước
 * khẩu phần (số lượng + tên); 100 g / 100 ml chỉ nhắc rằng số liệu tính trên 100 g (BE chưa có mật độ nên 100 ml coi như 100 g).
 */
export function ServingSection({ state, errors, onBasisChange, onChange }: ServingSectionProps) {
  return (
    <section aria-labelledby="create-serving" className="space-y-5">
      <h2 id="create-serving" className="text-xl font-bold">
        Serving Information
      </h2>
      <SlidingSwitch
        variant="block"
        options={BASIS_OPTIONS}
        value={state.basis}
        onChange={onBasisChange}
        label="Nutrition values are given per"
        className="bg-secondary"
      />

      {state.basis === 'serving' ? (
        <>
          <div>
            <FieldLabel htmlFor="create-serving-weight">Serving Weight</FieldLabel>
            <div className="flex gap-2">
              <input
                id="create-serving-weight"
                value={state.weight}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(errors.serving) && state.weight.trim() === ''}
                onChange={(event) => onChange({ weight: event.target.value })}
                className={FIELD_CLASS}
              />
              <PickerSelect
                aria-label="Weight unit"
                title="Weight Unit"
                options={WEIGHT_UNITS.map((unit) => ({ value: unit.label, label: unit.label }))}
                value={state.weightUnit}
                onValueChange={(weightUnit) =>
                  onChange({ weightUnit: weightUnit as CreateFoodState['weightUnit'] })
                }
                className="md:bg-secondary h-14 w-24 shrink-0 rounded-lg px-4 md:h-14 md:rounded-lg md:border-transparent md:px-4 md:text-base"
              />
            </div>
            <p className={HELP}>
              If you provide the serving weight, all standard units of weight will be available when
              you log this food.
            </p>
          </div>

          <div>
            <FieldLabel htmlFor="create-serving-name" hint="Required">
              Serving Size
            </FieldLabel>
            <div className="flex gap-2">
              <input
                aria-label="Serving quantity"
                value={state.servingQty}
                inputMode="decimal"
                autoComplete="off"
                onChange={(event) => onChange({ servingQty: event.target.value })}
                className={`${FIELD_CLASS} w-24 shrink-0`}
              />
              <input
                id="create-serving-name"
                value={state.servingName}
                maxLength={100}
                autoComplete="off"
                placeholder='e.g. cup, slice, large - 3" diameter'
                aria-invalid={Boolean(errors.serving) && state.servingName.trim() === ''}
                onChange={(event) => onChange({ servingName: event.target.value })}
                className={FIELD_CLASS}
              />
            </div>
            <p className={HELP}>
              If a serving is 4 pieces, enter 4 for quantity and pieces for serving name
            </p>
            <FieldError message={errors.serving} />
          </div>
        </>
      ) : (
        <p className={HELP}>
          {state.basis === '100g'
            ? 'Enter the nutrition values for 100 g of this food. You can still log it by weight in any unit.'
            : 'Enter the nutrition values for 100 ml. MacroOS treats 100 ml as 100 g because it does not store densities yet.'}
        </p>
      )}
    </section>
  )
}

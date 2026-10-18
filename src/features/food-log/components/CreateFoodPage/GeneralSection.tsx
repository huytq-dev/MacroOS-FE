'use client'

import { useState } from 'react'
import { Keyboard, ScanBarcode } from 'lucide-react'
import { toast } from 'sonner'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { cn } from '@/lib/utils'
import type { CreateFoodState, FieldErrors } from '../../create-food.utils'
import { FIELD_CLASS, FieldError, FieldLabel } from './field'

interface GeneralSectionProps {
  readonly name: string
  readonly brand: string
  readonly barcode: string
  readonly iconKey: string | null
  readonly errors: FieldErrors
  readonly onChange: (partial: Partial<Pick<CreateFoodState, 'name' | 'brand' | 'barcode'>>) => void
  readonly onEditIcon: () => void
}

/**
 * "General Information": thẻ Food Icon (icon + tên + hãng, nút Edit Icon), tên món, hãng và mã vạch (quét hoặc gõ tay). Quét bằng
 * camera chưa có ở trang này nên nút Scan báo "sắp có"; nút bàn phím mở ô nhập mã.
 */
export function GeneralSection({
  name,
  brand,
  barcode,
  iconKey,
  errors,
  onChange,
  onEditIcon,
}: GeneralSectionProps) {
  const [manual, setManual] = useState(barcode !== '')
  return (
    <section aria-labelledby="create-general" className="space-y-5">
      <h2 id="create-general" className="text-xl font-bold">
        General Information
      </h2>

      <div>
        <FieldLabel hint="Required">Food Icon</FieldLabel>
        <div className="border-border flex items-center gap-3 rounded-xl border-2 py-2.5 pr-3 pl-4">
          <FoodIcon iconKey={iconKey} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base leading-snug font-medium">
              {name.trim() || 'New food'}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {brand.trim() || 'Brand Unknown'}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditIcon}
            className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 h-11 shrink-0 rounded-full px-4 text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
          >
            Edit Icon
          </button>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="create-food-name" hint="Required">
          Food Name
        </FieldLabel>
        <input
          id="create-food-name"
          value={name}
          maxLength={256}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => onChange({ name: event.target.value })}
          className={FIELD_CLASS}
        />
        <FieldError message={errors.name} />
      </div>

      <div>
        <FieldLabel htmlFor="create-food-brand">Brand Name</FieldLabel>
        <input
          id="create-food-brand"
          value={brand}
          maxLength={256}
          autoComplete="off"
          placeholder="Enter brand name"
          onChange={(event) => onChange({ brand: event.target.value })}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="create-food-barcode">Barcode</FieldLabel>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toast('Barcode scanning is coming soon')}
            className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-[0.99]"
          >
            <ScanBarcode aria-hidden="true" className="size-5" />
            Scan
          </button>
          <button
            type="button"
            aria-label="Enter barcode manually"
            aria-pressed={manual}
            onClick={() => setManual((current) => !current)}
            className={cn(
              'focus-visible:ring-ring/50 flex h-14 w-16 shrink-0 items-center justify-center rounded-lg transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95',
              manual ? 'bg-foreground text-background' : 'bg-secondary'
            )}
          >
            <Keyboard aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            manual ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden" inert={!manual}>
            <input
              id="create-food-barcode"
              value={barcode}
              inputMode="numeric"
              maxLength={64}
              autoComplete="off"
              placeholder="Barcode number"
              onChange={(event) => onChange({ barcode: event.target.value })}
              className={cn(FIELD_CLASS, 'mt-2')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

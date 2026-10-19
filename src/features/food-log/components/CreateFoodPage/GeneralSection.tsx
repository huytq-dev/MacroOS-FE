'use client'

import { useState } from 'react'
import { Keyboard, ScanBarcode, X } from 'lucide-react'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { BarcodeSheet } from '../FoodLogPage/BarcodeSheet'
import { ScanPanel } from '../FoodLogPage/ScanPanel'
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
 * "General Information": thẻ Food Icon (icon + tên + hãng, nút Edit Icon), tên món, hãng và mã vạch: Scan mở camera quét
 * (`ScanPanel`), nút bàn phím mở bảng "Manual Barcode" (`BarcodeSheet`); có mã rồi thì nút Scan hiện mã, nút X để xoá.
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
  const [sheet, setSheet] = useState<'scan' | 'manual' | null>(null)
  const setCode = (code: string) => {
    onChange({ barcode: code })
    setSheet(null)
  }
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
        <FieldLabel>Barcode</FieldLabel>
        <div className="flex gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSheet('scan')}
            className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg text-base transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-[0.99]"
          >
            <ScanBarcode aria-hidden="true" className="size-5 shrink-0" />
            <span className="truncate tabular-nums">{barcode || 'Scan'}</span>
          </button>
          {barcode ? (
            <button
              type="button"
              aria-label="Remove barcode"
              onClick={() => onChange({ barcode: '' })}
              className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 w-16 shrink-0 items-center justify-center rounded-lg transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Enter barcode manually"
              aria-haspopup="dialog"
              onClick={() => setSheet('manual')}
              className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex h-14 w-16 shrink-0 items-center justify-center rounded-lg transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95"
            >
              <Keyboard aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Dùng lại đúng hai màn của tab Scan trong bảng Thêm món: camera quét và bảng "Manual Barcode" (mount mới mỗi lần mở). */}
      <SheetFrame
        open={sheet === 'scan'}
        onOpenChange={(open) => !open && setSheet(null)}
        title="Scan Barcode"
        showDone={false}
        tall
      >
        <ScanPanel
          active={sheet === 'scan'}
          isLookingUp={false}
          error={null}
          onCode={setCode}
          onManual={() => setSheet('manual')}
        />
      </SheetFrame>
      {sheet === 'manual' && (
        <BarcodeSheet
          open
          onOpenChange={(open) => !open && setSheet(null)}
          isPending={false}
          error={null}
          onLookup={setCode}
        />
      )}
    </section>
  )
}

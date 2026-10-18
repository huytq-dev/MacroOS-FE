'use client'

import { useState } from 'react'
import { ScanBarcode } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MIN_DIGITS = 8
const MAX_DIGITS = 14

interface BarcodeSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly isPending: boolean
  readonly error: string | null
  readonly onLookup: (code: string) => void
}

/**
 * Bảng tra mã vạch: nhập 8–14 chữ số in dưới mã vạch (quét bằng camera chưa có), BE tìm trong thư viện rồi tới Open Food Facts.
 * Mount mới mỗi lần mở nên ô nhập luôn trống.
 */
export function BarcodeSheet({
  open,
  onOpenChange,
  isPending,
  error,
  onLookup,
}: BarcodeSheetProps) {
  const [code, setCode] = useState('')
  const valid = code.length >= MIN_DIGITS && code.length <= MAX_DIGITS

  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Manual Barcode" showDone={false}>
      <form
        className="space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (valid && !isPending) onLookup(code)
        }}
      >
        <label className="block space-y-2">
          <span className="text-base font-medium">Barcode</span>
          <Input
            autoFocus
            inputMode="numeric"
            placeholder="Enter the barcode number"
            maxLength={MAX_DIGITS}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="h-12 rounded-lg text-base tabular-nums"
          />
        </label>
        <div aria-hidden="true" className="flex flex-col items-center gap-1.5">
          <ScanBarcode className="size-14" strokeWidth={1.2} />
          <p className="text-muted-foreground text-sm">
            The {MIN_DIGITS}–{MAX_DIGITS} digit number under the barcode
          </p>
        </div>
        <FormErrorAlert title="Couldn't find this barcode" message={error} />
        <Button
          type="submit"
          disabled={!valid || isPending}
          className="h-12 w-full rounded-lg text-base"
        >
          {isPending ? 'Looking up...' : 'Lookup Barcode'}
        </Button>
      </form>
    </SheetFrame>
  )
}

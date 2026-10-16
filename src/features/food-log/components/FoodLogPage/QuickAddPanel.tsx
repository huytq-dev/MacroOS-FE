'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface QuickAddValues {
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface QuickAddPanelProps {
  readonly isPending: boolean
  readonly onSubmit: (values: QuickAddValues) => void
}

/** Khớp BE QuickAddCommandValidator: kcal 0–10000, macro 0–1000. State cục bộ (form 5 ô, không cần RHF). */
export function QuickAddPanel({ isPending, onSubmit }: QuickAddPanelProps) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const toNumber = (text: string) => (text.trim() === '' ? 0 : Number(text))
  const values = { calories: toNumber(calories), protein: toNumber(protein), carbs: toNumber(carbs), fat: toNumber(fat) }
  const valid =
    calories.trim() !== '' &&
    values.calories >= 0 &&
    values.calories <= 10000 &&
    [values.protein, values.carbs, values.fat].every((value) => value >= 0 && value <= 1000)

  const field = (id: string, label: string, value: string, setValue: (next: string) => void, autoFocus = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" step="0.1" value={value} autoFocus={autoFocus} onChange={(event) => setValue(event.target.value)} />
    </div>
  )

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) onSubmit({ name: name.trim() || null, ...values })
      }}
    >
      <p className="text-muted-foreground text-sm">
        Nhập thẳng kcal và macro khi không tìm được món. Không lưu để tìm lại (muốn tái dùng hãy tạo ở mục Thực phẩm).
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="quick-name">Tên (tuỳ chọn)</Label>
        <Input id="quick-name" value={name} maxLength={256} onChange={(event) => setName(event.target.value)} />
      </div>
      {field('quick-calories', 'Calories (kcal)', calories, setCalories, true)}
      <div className="grid grid-cols-3 gap-3">
        {field('quick-protein', 'Protein (g)', protein, setProtein)}
        {field('quick-carbs', 'Carbs (g)', carbs, setCarbs)}
        {field('quick-fat', 'Fat (g)', fat, setFat)}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!valid || isPending}>
        {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
        Thêm nhanh
      </Button>
    </form>
  )
}

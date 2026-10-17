'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface QuickAddValues {
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface QuickAddPanelProps {
  readonly isPending: boolean
  readonly error: string | null
  readonly onSubmit: (values: QuickAddValues) => void
}

const rangeError = (text: string, max: number) => {
  if (text.trim() === '') return undefined
  const value = Number(text)
  return value >= 0 && value <= max ? undefined : `Enter a value from 0 to ${max}`
}

/** Khớp BE QuickAddCommandValidator: kcal 0–10000, macro 0–1000. State cục bộ (form 5 ô, không cần RHF). */
export function QuickAddPanel({ isPending, error, onSubmit }: QuickAddPanelProps) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const toNumber = (text: string) => (text.trim() === '' ? 0 : Number(text))
  const values = {
    calories: toNumber(calories),
    protein: toNumber(protein),
    carbs: toNumber(carbs),
    fat: toNumber(fat),
  }
  const errors = {
    calories: rangeError(calories, 10000),
    protein: rangeError(protein, 1000),
    carbs: rangeError(carbs, 1000),
    fat: rangeError(fat, 1000),
  }
  const valid =
    calories.trim() !== '' && !errors.calories && !errors.protein && !errors.carbs && !errors.fat

  const numberField = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    fieldError?: string,
    extra?: { required?: boolean; autoFocus?: boolean }
  ) => (
    <FormField label={label} required={extra?.required} error={fieldError}>
      {(field) => (
        <Input
          {...field}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          autoFocus={extra?.autoFocus}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
    </FormField>
  )

  return (
    <form
      noValidate
      className="space-y-4 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && !isPending) onSubmit({ name: name.trim() || null, ...values })
      }}
    >
      <p className="text-muted-foreground text-sm">
        Enter calories and macros directly when you can&apos;t find a food. It isn&apos;t saved for
        search (to reuse it, create it under Foods).
      </p>
      <FormErrorAlert title="Couldn't quick add" message={error} />
      <FormField label="Name" hint="Optional">
        {(field) => (
          <Input
            {...field}
            value={name}
            maxLength={256}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </FormField>
      {numberField('Calories (kcal)', calories, setCalories, errors.calories, {
        required: true,
        autoFocus: true,
      })}
      <div className="grid grid-cols-3 gap-3">
        {numberField('Protein (g)', protein, setProtein, errors.protein)}
        {numberField('Carbs (g)', carbs, setCarbs, errors.carbs)}
        {numberField('Fat (g)', fat, setFat, errors.fat)}
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!valid || isPending}
        aria-busy={isPending}
      >
        {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {isPending ? 'Adding...' : 'Quick add'}
      </Button>
    </form>
  )
}

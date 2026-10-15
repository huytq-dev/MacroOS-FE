'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { LogWeightFormValues } from '../../schemas/log-weight.schema'

interface LogWeightDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly form: UseFormReturn<LogWeightFormValues>
  readonly isPending: boolean
  readonly onSubmit: (values: LogWeightFormValues) => void
}

export function LogWeightDialog({ open, onOpenChange, form, isPending, onSubmit }: LogWeightDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <DialogHeader>
            <DialogTitle>Ghi cân nặng</DialogTitle>
            <DialogDescription>Mỗi ngày một giá trị; nhập lại cùng ngày sẽ ghi đè và tính lại trend.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="logDate">Ngày</Label>
              <Input id="logDate" type="date" {...register('logDate')} />
              {errors.logDate && <p className="text-destructive text-[11px]">{errors.logDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weightKg">Cân nặng (kg)</Label>
              <Input id="weightKg" type="number" inputMode="decimal" step="0.1" autoFocus {...register('weightKg', { valueAsNumber: true })} />
              {errors.weightKg && <p className="text-destructive text-[11px]">{errors.weightKg.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea id="notes" rows={2} {...register('notes')} />
              {errors.notes && <p className="text-destructive text-[11px]">{errors.notes.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GOAL_TYPE, PROGRAM_TYPE, enumOptions, type GoalType, type ProgramType } from '@/config/enums'
import { cn } from '@/lib/utils'
import type { Program, UpdateProgramGoalRequest } from '../../types/program.types'

interface ProgramActionsProps {
  readonly program: Program
  readonly isPending: boolean
  readonly onUpdateGoal: (payload: UpdateProgramGoalRequest) => void
  readonly onChangeStyle: (programType: ProgramType) => void
  readonly onSetManualTdee: (tdeeKcal: number) => void
  readonly onEnd: () => void
}

type Open = 'goal' | 'style' | 'tdee' | 'end' | null

/** Orchestrator: giữ state dialog, nhận callback từ page (không gọi hook server). */
export function ProgramActions({ program, isPending, onUpdateGoal, onChangeStyle, onSetManualTdee, onEnd }: ProgramActionsProps) {
  const [open, setOpen] = useState<Open>(null)
  const [goalType, setGoalType] = useState<GoalType>(program.goalType)
  const [rate, setRate] = useState(Math.abs(program.weeklyWeightChangeTargetPercent))
  const [style, setStyle] = useState<ProgramType>(program.programType)
  const [tdee, setTdee] = useState(program.manualInitialTdeeKcal ?? 2000)
  const close = () => setOpen(null)

  const pills = <T extends string>(labels: Record<T, string>, value: T, onChange: (next: T) => void) => (
    <div className="grid grid-cols-1 gap-2">
      {enumOptions(labels).map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value as T)}
          className={cn(
            'min-h-10 rounded-md border px-3 py-2 text-left text-xs transition-colors',
            value === option.value ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  const footer = (label: string, onConfirm: () => void, destructive = false) => (
    <DialogFooter>
      <Button variant="outline" onClick={close} disabled={isPending}>
        Huỷ
      </Button>
      <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={isPending}>
        {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
        {label}
      </Button>
    </DialogFooter>
  )

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen('goal')}>
          Sửa mục tiêu
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen('style')}>
          Đổi style
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen('tdee')}>
          Nhập TDEE tay
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setOpen('end')}>
          Kết thúc program
        </Button>
      </div>

      <Dialog open={open === 'goal'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa mục tiêu</DialogTitle>
            <DialogDescription>Tính lại target tuần hiện tại ngay.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pills(GOAL_TYPE, goalType, setGoalType)}
            <div className="space-y-1.5">
              <Label htmlFor="rate">Tốc độ (%/tuần, 0 nếu giữ cân)</Label>
              <Input
                id="rate"
                type="number"
                inputMode="decimal"
                step="0.05"
                min={0}
                max={1.5}
                value={rate}
                disabled={goalType === 'Maintenance'}
                onChange={(event) => setRate(Number(event.target.value))}
              />
            </div>
          </div>
          {footer('Lưu', () =>
            onUpdateGoal({ goalType, weeklyWeightChangeTargetPercent: goalType === 'Maintenance' ? 0 : rate })
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'style'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đổi program style</DialogTitle>
            <DialogDescription>Không mất dữ liệu, không reset expenditure.</DialogDescription>
          </DialogHeader>
          {pills(PROGRAM_TYPE, style, setStyle)}
          {footer('Đổi', () => onChangeStyle(style))}
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'tdee'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>TDEE khởi điểm nhập tay</DialogTitle>
            <DialogDescription>Thuật toán expenditure học lại từ hôm nay với số này.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tdee">kcal/ngày (1000–6000)</Label>
            <Input id="tdee" type="number" inputMode="numeric" value={tdee} onChange={(event) => setTdee(Number(event.target.value))} />
          </div>
          {footer('Lưu', () => onSetManualTdee(tdee))}
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'end'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kết thúc program?</DialogTitle>
            <DialogDescription>Lịch sử tuần được giữ; bạn có thể tạo program mới ngay sau đó.</DialogDescription>
          </DialogHeader>
          {footer('Kết thúc', onEnd, true)}
        </DialogContent>
      </Dialog>
    </>
  )
}

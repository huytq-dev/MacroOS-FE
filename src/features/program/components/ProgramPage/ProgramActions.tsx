'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ChoiceGroup } from '@/components/shared/ChoiceGroup'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GOAL_TYPE, PROGRAM_TYPE, type GoalType, type ProgramType } from '@/config/enums'
import { toChoices } from '../../utils/choices'
import type { Program, UpdateProgramGoalRequest } from '../../types/program.types'

export interface ActionState {
  readonly isPending: boolean
  readonly error: string | null
}

export type ActionKind = 'goal' | 'style' | 'tdee' | 'end'

interface ProgramActionsProps {
  readonly program: Program
  readonly goal: ActionState
  readonly style: ActionState
  readonly tdee: ActionState
  readonly end: ActionState
  /** Mở dialog → cha xoá lỗi cũ của mutation tương ứng. */
  readonly onOpen: (kind: ActionKind) => void
  readonly onUpdateGoal: (payload: UpdateProgramGoalRequest, onDone: () => void) => void
  readonly onChangeStyle: (programType: ProgramType, onDone: () => void) => void
  readonly onSetManualTdee: (tdeeKcal: number, onDone: () => void) => void
  readonly onEnd: (onDone: () => void) => void
}

interface BodyProps {
  readonly state: ActionState
  readonly onCancel: () => void
}

function Footer({
  state,
  onCancel,
  label,
  pendingLabel,
  disabled,
}: BodyProps & { label: string; pendingLabel: string; disabled?: boolean }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={state.isPending}>
        Huỷ
      </Button>
      <Button type="submit" disabled={state.isPending || disabled} aria-busy={state.isPending}>
        {state.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {state.isPending ? pendingLabel : label}
      </Button>
    </DialogFooter>
  )
}

const GOAL_CHOICES = toChoices(GOAL_TYPE)
const STYLE_CHOICES = toChoices(PROGRAM_TYPE)

function GoalBody({
  program,
  state,
  onCancel,
  onSubmit,
}: BodyProps & { program: Program; onSubmit: (payload: UpdateProgramGoalRequest) => void }) {
  const [goalType, setGoalType] = useState<GoalType>(program.goalType)
  const [rate, setRate] = useState(String(Math.abs(program.weeklyWeightChangeTargetPercent)))
  const maintenance = goalType === 'Maintenance'
  const rateNumber = Number(rate)
  const rateError =
    maintenance || (rate.trim() !== '' && rateNumber >= 0 && rateNumber <= 1.5)
      ? undefined
      : 'Nhập từ 0 đến 1,5 %/tuần'
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (state.isPending || rateError) return
        onSubmit({ goalType, weeklyWeightChangeTargetPercent: maintenance ? 0 : rateNumber })
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-sans text-sm font-semibold">Sửa mục tiêu</DialogTitle>
        <DialogDescription className="text-xs">
          Tính lại target tuần hiện tại ngay.
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Không sửa được mục tiêu" message={state.error} />
      <ChoiceGroup
        options={GOAL_CHOICES}
        value={goalType}
        onValueChange={setGoalType}
        aria-label="Mục tiêu"
      />
      <FormField label="Tốc độ (%/tuần)" hint="Giữ cân thì không cần nhập" error={rateError}>
        {(field) => (
          <Input
            {...field}
            type="number"
            inputMode="decimal"
            step="0.05"
            min={0}
            max={1.5}
            value={maintenance ? '0' : rate}
            disabled={maintenance}
            onChange={(event) => setRate(event.target.value)}
          />
        )}
      </FormField>
      <Footer
        state={state}
        onCancel={onCancel}
        label="Lưu"
        pendingLabel="Đang lưu..."
        disabled={Boolean(rateError)}
      />
    </form>
  )
}

function StyleBody({
  program,
  state,
  onCancel,
  onSubmit,
}: BodyProps & { program: Program; onSubmit: (programType: ProgramType) => void }) {
  const [style, setStyle] = useState<ProgramType>(program.programType)
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!state.isPending) onSubmit(style)
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-sans text-sm font-semibold">Đổi program style</DialogTitle>
        <DialogDescription className="text-xs">
          Không mất dữ liệu, không reset expenditure.
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Không đổi được style" message={state.error} />
      <ChoiceGroup
        options={STYLE_CHOICES}
        value={style}
        onValueChange={setStyle}
        aria-label="Program style"
      />
      <Footer state={state} onCancel={onCancel} label="Đổi style" pendingLabel="Đang đổi..." />
    </form>
  )
}

function TdeeBody({
  program,
  state,
  onCancel,
  onSubmit,
}: BodyProps & { program: Program; onSubmit: (tdeeKcal: number) => void }) {
  const [tdee, setTdee] = useState(String(program.manualInitialTdeeKcal ?? 2000))
  const tdeeNumber = Number(tdee)
  const error =
    tdee.trim() !== '' && tdeeNumber >= 1000 && tdeeNumber <= 6000
      ? undefined
      : 'Nhập từ 1000 đến 6000 kcal'
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (state.isPending || error) return
        onSubmit(tdeeNumber)
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-sans text-sm font-semibold">
          TDEE khởi điểm nhập tay
        </DialogTitle>
        <DialogDescription className="text-xs">
          Thuật toán expenditure học lại từ hôm nay với số này.
        </DialogDescription>
      </DialogHeader>
      <FormErrorAlert title="Không đặt được TDEE" message={state.error} />
      <FormField label="TDEE (kcal/ngày)" required error={error}>
        {(field) => (
          <Input
            {...field}
            type="number"
            inputMode="numeric"
            autoFocus
            value={tdee}
            onChange={(event) => setTdee(event.target.value)}
          />
        )}
      </FormField>
      <Footer
        state={state}
        onCancel={onCancel}
        label="Lưu"
        pendingLabel="Đang lưu..."
        disabled={Boolean(error)}
      />
    </form>
  )
}

/** Orchestrator: giữ state mở/đóng dialog, nhận callback từ page (không gọi hook server). Body chỉ mount khi mở → state luôn lấy lại từ program. */
export function ProgramActions({
  program,
  goal,
  style,
  tdee,
  end,
  onOpen,
  onUpdateGoal,
  onChangeStyle,
  onSetManualTdee,
  onEnd,
}: ProgramActionsProps) {
  const [open, setOpen] = useState<ActionKind | null>(null)
  const close = () => setOpen(null)
  const show = (kind: ActionKind) => {
    onOpen(kind)
    setOpen(kind)
  }
  const sheet = (
    kind: Exclude<ActionKind, 'end'>,
    state: ActionState,
    children: React.ReactNode
  ) => (
    <Dialog open={open === kind} onOpenChange={(isOpen) => !isOpen && !state.isPending && close()}>
      <DialogContent className="max-w-lg">{open === kind && children}</DialogContent>
    </Dialog>
  )

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => show('goal')}>
          Sửa mục tiêu
        </Button>
        <Button variant="outline" size="sm" onClick={() => show('style')}>
          Đổi style
        </Button>
        <Button variant="outline" size="sm" onClick={() => show('tdee')}>
          Nhập TDEE tay
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => show('end')}>
          Kết thúc program
        </Button>
      </div>

      {sheet(
        'goal',
        goal,
        <GoalBody
          program={program}
          state={goal}
          onCancel={close}
          onSubmit={(payload) => onUpdateGoal(payload, close)}
        />
      )}
      {sheet(
        'style',
        style,
        <StyleBody
          program={program}
          state={style}
          onCancel={close}
          onSubmit={(type) => onChangeStyle(type, close)}
        />
      )}
      {sheet(
        'tdee',
        tdee,
        <TdeeBody
          program={program}
          state={tdee}
          onCancel={close}
          onSubmit={(kcal) => onSetManualTdee(kcal, close)}
        />
      )}

      <ConfirmDialog
        open={open === 'end'}
        onOpenChange={(isOpen) => !isOpen && close()}
        title="Kết thúc program?"
        description="Lịch sử tuần được giữ. Bạn có thể tạo program mới ngay sau đó."
        confirmLabel="Kết thúc program"
        pendingLabel="Đang kết thúc..."
        isPending={end.isPending}
        onConfirm={() => onEnd(close)}
      />
    </>
  )
}

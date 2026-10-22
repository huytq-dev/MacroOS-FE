'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ChoiceGroup } from '@/components/shared/ChoiceGroup'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { FormField } from '@/components/shared/FormField'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DIET_STYLE,
  PROGRAM_TYPE,
  PROTEIN_LEVEL,
  type DietStyle,
  type ProgramType,
  type ProteinLevel,
} from '@/config/enums'
import { toChoices } from '../../utils/choices'
import {
  TDEE_BOUNDS_HINT,
  TDEE_MAX_KCAL,
  TDEE_MIN_KCAL,
  tdeeError,
  tdeeEstimateHint,
  tdeeSheetValue,
  type TdeeEstimate,
} from '../../utils/tdee.utils'
import type { Feasibility } from '../../types/feasibility.types'
import type { Program, UpdateProgramGoalRequest } from '../../types/program.types'
import { reduceShiftRequestOf } from '../../utils/calorie-shift'
import { isShiftInfeasible } from '../../utils/feasibility'
import { FeasibilityNotice, type FeasibilityNoticeProps } from '../FeasibilityNotice'

export interface ActionState {
  readonly isPending: boolean
  readonly error: string | null
  /** 400 `FeasibilityResponse` của BE (nothing persisted); thay cho câu lỗi chung khi có. */
  readonly feasibility?: Feasibility | null
}

/** Lỗi của một bảng: target không khả thi thì nêu vi phạm + cách chỉnh của BE (kèm nút xác nhận nếu bảng làm được), còn lại là câu lỗi chung. */
function ActionError({
  title,
  state,
  apply,
}: {
  readonly title: string
  readonly state: ActionState
  readonly apply?: FeasibilityNoticeProps['apply']
}) {
  if (state.feasibility) return <FeasibilityNotice feasibility={state.feasibility} apply={apply} />
  return <FormErrorAlert title={title} message={state.error} />
}

/** Nút xác nhận của một lỗi Calorie Shift: giảm % (`reduceShiftRequestOf`) và chia đều; không do shift hoặc không áp được thì không có nút. */
function shiftButtons(
  program: Program,
  feasibility: Feasibility | null | undefined,
  submit: (payload: UpdateProgramGoalRequest) => void
): FeasibilityNoticeProps['apply'] {
  if (!feasibility || !isShiftInfeasible(feasibility)) return undefined
  const reduce = reduceShiftRequestOf(program, feasibility)
  return [
    ...(reduce
      ? [
          {
            code: 'REDUCE_SHIFT' as const,
            label: `Use a ${reduce.calorieShiftPercent}% shift`,
            onClick: () => submit(reduce),
          },
        ]
      : []),
    ...(feasibility.actions.includes('USE_EVEN_DISTRIBUTION')
      ? [
          {
            code: 'USE_EVEN_DISTRIBUTION' as const,
            label: 'Use an even split across the week',
            onClick: () => submit({ calorieShiftMode: 'Even' }),
          },
        ]
      : []),
  ]
}

export type ActionKind = 'menu' | 'program' | 'style' | 'tdee' | 'end'

interface ProgramActionsProps {
  /** Bảng đang mở; null = đóng hết. */
  readonly open: ActionKind | null
  readonly onOpenChange: (next: ActionKind | null) => void
  readonly program: Program
  readonly programEdit: ActionState
  readonly style: ActionState
  readonly tdee: ActionState
  /** TDEE ước tính hiện tại của BE (cùng nguồn với trang Expenditure): đang tải / lỗi / đã có. */
  readonly tdeeEstimate: TdeeEstimate
  readonly end: ActionState
  readonly onSaveProgram: (payload: UpdateProgramGoalRequest, onDone: () => void) => void
  readonly onChangeStyle: (programType: ProgramType, onDone: () => void) => void
  readonly onSetManualTdee: (tdeeKcal: number, onDone: () => void) => void
  readonly onEnd: (onDone: () => void) => void
}

interface BodyProps {
  readonly state: ActionState
  readonly onCancel: () => void
}

const ROW =
  'focus-visible:ring-ring/50 flex min-h-14 w-full items-center px-4 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none active:bg-muted'
const INPUT = 'h-12 text-base'

/** Nút Save trắng + Cancel dính đáy bảng, như các bảng khác của app. */
function Footer({
  state,
  onCancel,
  label,
  pendingLabel,
  disabled,
}: BodyProps & { label: string; pendingLabel: string; disabled?: boolean }) {
  return (
    <div className="bg-popover sticky bottom-0 mt-auto space-y-1 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Button
        type="submit"
        className="bg-foreground text-background h-12 w-full rounded-lg text-base"
        disabled={state.isPending || disabled}
        aria-busy={state.isPending}
      >
        {state.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {state.isPending ? pendingLabel : label}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-12 w-full text-base"
        onClick={onCancel}
        disabled={state.isPending}
      >
        Cancel
      </Button>
    </div>
  )
}

const STYLE_CHOICES = toChoices(PROGRAM_TYPE)
const DIET_CHOICES = toChoices(DIET_STYLE)
const PROTEIN_CHOICES = toChoices(PROTEIN_LEVEL)

function ProgramBody({
  program,
  state,
  onCancel,
  onSubmit,
}: BodyProps & { program: Program; onSubmit: (payload: UpdateProgramGoalRequest) => void }) {
  const [dietStyle, setDietStyle] = useState<DietStyle>(program.dietStyle)
  const [proteinLevel, setProteinLevel] = useState<ProteinLevel>(program.proteinLevel)
  const [floor, setFloor] = useState(program.calorieFloorKcal?.toString() ?? '')
  const floorNumber = Number(floor)
  const floorError =
    floor.trim() === '' || (floorNumber >= 800 && floorNumber <= 3000)
      ? undefined
      : 'Enter 800 to 3000 kcal'
  return (
    <form
      noValidate
      className="flex min-h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (state.isPending || floorError) return
        onSubmit({
          dietStyle,
          proteinLevel,
          calorieFloorKcal: floor.trim() === '' ? null : floorNumber,
        })
      }}
    >
      <div className="space-y-5 p-4">
        <ActionError
          title="Couldn't update program"
          state={state}
          // Chỉ gửi khi user bấm: giảm % (gửi lại ngày đang lưu của program) hoặc chia đều; không bao giờ tự chuyển sang Even
          apply={shiftButtons(program, state.feasibility, onSubmit)}
        />
        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-medium">Diet style</legend>
          <ChoiceGroup
            options={DIET_CHOICES}
            value={dietStyle}
            onValueChange={setDietStyle}
            aria-label="Diet style"
          />
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-medium">Protein level</legend>
          <ChoiceGroup
            options={PROTEIN_CHOICES}
            value={proteinLevel}
            onValueChange={setProteinLevel}
            aria-label="Protein level"
          />
        </fieldset>
        <FormField label="Calorie floor (kcal)" hint="Optional" error={floorError}>
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="numeric"
              className={INPUT}
              value={floor}
              onChange={(event) => setFloor(event.target.value)}
            />
          )}
        </FormField>
      </div>
      <Footer
        state={state}
        onCancel={onCancel}
        label="Save"
        pendingLabel="Saving..."
        disabled={Boolean(floorError)}
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
      className="flex min-h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!state.isPending) onSubmit(style)
      }}
    >
      <div className="space-y-4 p-4">
        <p className="text-muted-foreground text-base">
          Your data is kept and your expenditure isn&apos;t reset.
        </p>
        <ActionError title="Couldn't change style" state={state} />
        <ChoiceGroup
          options={STYLE_CHOICES}
          value={style}
          onValueChange={setStyle}
          aria-label="Program style"
        />
      </div>
      <Footer state={state} onCancel={onCancel} label="Change style" pendingLabel="Changing..." />
    </form>
  )
}

/**
 * Ô "Set TDEE": mở ở TDEE ƯỚC TÍNH HIỆN TẠI của BE (đang tải / lỗi / chưa có thì để trống và nói rõ lý do) — Lưu đặt lại thuật toán về đúng
 * số trong ô nên không bao giờ điền sẵn số mặc định. Lưu bị khoá cho tới khi có số nguyên trong khoảng 1000–6000 của BE; ô trống thì hiện
 * dòng nhắc giới hạn, nhập sai thì hiện lỗi. Ước tính về muộn chỉ điền vào ô còn CHƯA GÕ, không dựng lại ô.
 */
function TdeeBody({
  estimate,
  state,
  onCancel,
  onSubmit,
}: BodyProps & { estimate: TdeeEstimate; onSubmit: (tdeeKcal: number) => void }) {
  // null = chưa gõ gì (ô theo ước tính của BE); đã gõ / đã xoá thì giữ đúng chuỗi người dùng nhập
  const [typed, setTyped] = useState<string | null>(null)
  const tdee = tdeeSheetValue(typed, estimate.kcal)
  const error = tdeeError(tdee)
  const empty = tdee.trim() === ''
  return (
    <form
      noValidate
      className="flex min-h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (state.isPending || error) return
        onSubmit(Number(tdee))
      }}
    >
      <div className="space-y-4 p-4">
        <p className="text-muted-foreground text-base">
          The expenditure algorithm relearns from today using this number.{' '}
          {tdeeEstimateHint(estimate)}
        </p>
        <ActionError title="Couldn't set TDEE" state={state} />
        <FormField
          label="TDEE (kcal/day)"
          required
          hint={empty ? TDEE_BOUNDS_HINT : undefined}
          error={empty ? undefined : error}
        >
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="numeric"
              min={TDEE_MIN_KCAL}
              max={TDEE_MAX_KCAL}
              step={1}
              className={INPUT}
              value={tdee}
              onChange={(event) => setTyped(event.target.value)}
            />
          )}
        </FormField>
      </div>
      <Footer
        state={state}
        onCancel={onCancel}
        label="Save"
        pendingLabel="Saving..."
        disabled={Boolean(error)}
      />
    </form>
  )
}

/**
 * Các bảng trượt của tab Strategy, điều khiển từ ngoài (`open`): menu ba chấm (đổi kiểu program, TDEE thủ công, kết thúc program),
 * Edit Program (diet style, protein, calorie floor) và hộp xác nhận kết thúc program. Thân mỗi
 * bảng dựng mới sau mỗi lần mở (`session`) nên ô nhập luôn lấy lại giá trị từ program.
 */
export function ProgramActions({
  open,
  onOpenChange,
  program,
  programEdit,
  style,
  tdee,
  tdeeEstimate,
  end,
  onSaveProgram,
  onChangeStyle,
  onSetManualTdee,
  onEnd,
}: ProgramActionsProps) {
  const close = () => onOpenChange(null)
  const isOpen = (kind: ActionKind) => open === kind
  const onChange = (kind: ActionKind, state?: ActionState) => (next: boolean) => {
    if (!next && open === kind && !state?.isPending) close()
  }
  const [session, setSession] = useState(0)
  // Từ menu ba chấm chuyển sang bảng khác: tăng `session` để thân bảng mới dựng lại
  const show = (kind: ActionKind) => {
    setSession((current) => current + 1)
    onOpenChange(kind)
  }

  return (
    <>
      <SheetFrame
        open={isOpen('menu')}
        onOpenChange={onChange('menu')}
        title="Strategy"
        showDone={false}
      >
        <ul className="divide-border divide-y pb-2">
          <li>
            <button type="button" className={ROW} onClick={() => show('style')}>
              Change program style
            </button>
          </li>
          <li>
            <button type="button" className={ROW} onClick={() => show('tdee')}>
              Set TDEE manually
            </button>
          </li>
          <li>
            <button type="button" className={`${ROW} text-destructive`} onClick={() => show('end')}>
              End program
            </button>
          </li>
        </ul>
      </SheetFrame>

      <SheetFrame
        open={isOpen('program')}
        onOpenChange={onChange('program', programEdit)}
        title="Edit Program"
        showDone={false}
      >
        <ProgramBody
          key={session}
          program={program}
          state={programEdit}
          onCancel={close}
          onSubmit={(payload) => onSaveProgram(payload, close)}
        />
      </SheetFrame>

      <SheetFrame
        open={isOpen('style')}
        onOpenChange={onChange('style', style)}
        title="Program style"
        showDone={false}
      >
        <StyleBody
          key={session}
          program={program}
          state={style}
          onCancel={close}
          onSubmit={(type) => onChangeStyle(type, close)}
        />
      </SheetFrame>

      <SheetFrame
        open={isOpen('tdee')}
        onOpenChange={onChange('tdee', tdee)}
        title="Manual starting TDEE"
        showDone={false}
      >
        <TdeeBody
          key={session}
          estimate={tdeeEstimate}
          state={tdee}
          onCancel={close}
          onSubmit={(kcal) => onSetManualTdee(kcal, close)}
        />
      </SheetFrame>

      <ConfirmDialog
        open={isOpen('end')}
        onOpenChange={onChange('end')}
        title="End program?"
        description="Your weekly history is kept. You can create a new program right after."
        confirmLabel="End program"
        pendingLabel="Ending..."
        isPending={end.isPending}
        onConfirm={() => onEnd(close)}
      />
    </>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import type { PeriodEntry, PeriodRequest } from '../types/period.types'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/date'

const SYMPTOMS_MAX = 200
const NOTES_MAX = 500
const FIELD =
  'bg-secondary active:bg-muted focus-visible:ring-ring/50 flex h-14 w-full items-center justify-between gap-2 rounded-lg px-4 text-lg transition-colors focus-visible:ring-1 focus-visible:outline-none'

interface PeriodSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Kỳ đang sửa; null = thêm mới. Trang đặt `key` theo kỳ + dữ liệu để điền lại. */
  readonly entry: PeriodEntry | null
  readonly today: string
  readonly isPending: boolean
  /** Lỗi từ BE (vd. 409 trùng ngày bắt đầu). */
  readonly error: string | null
  readonly onSave: (payload: PeriodRequest) => void
  /** Chỉ khi đang sửa: hiện thùng rác (trang hỏi xác nhận). */
  readonly onDelete?: () => void
}

/**
 * Bảng thêm / sửa một kỳ kinh: Start Date (bắt buộc, mặc định hôm nay), End Date (tuỳ chọn, không trước ngày bắt đầu, có nút xoá),
 * Symptoms, Notes và Save. Ngày chọn bằng "Select Date" dùng chung; BE tự tính độ dài chu kỳ và kỳ kinh.
 */
export function PeriodSheet({
  open,
  onOpenChange,
  entry,
  today,
  isPending,
  error,
  onSave,
  onDelete,
}: PeriodSheetProps) {
  const [start, setStart] = useState(entry?.startDate ?? today)
  const [end, setEnd] = useState<string | null>(entry?.endDate ?? null)
  const [symptoms, setSymptoms] = useState(entry?.symptoms ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [picker, setPicker] = useState<'start' | 'end' | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  // Lỗi từ BE (vd. trùng ngày bắt đầu) ẩn khi người dùng sửa bất kỳ ô nào; hiện lại nếu lần lưu sau vẫn lỗi
  const [edited, setEdited] = useState(false)

  const submit = () => {
    if (isPending) return
    setEdited(false)
    if (end !== null && end < start) {
      setLocalError('The end date can’t be before the start date')
      return
    }
    onSave({
      startDate: start,
      endDate: end,
      symptoms: symptoms.trim() || null,
      notes: notes.trim() || null,
    })
  }

  const chooseStart = (date: string) => {
    setLocalError(null)
    setEdited(true)
    setStart(date)
    // Ngày kết thúc cũ nằm trước ngày bắt đầu mới thì bỏ để khỏi lưu sai
    if (end !== null && end < date) setEnd(null)
  }

  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={entry ? 'Edit Period' : 'Add Period'}
        subtitle="Period"
        showDone={false}
        headerAction={
          onDelete && (
            <button
              type="button"
              aria-label="Delete period"
              onClick={onDelete}
              className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-current">
                <path d="M9 3h6l1 1.5h4V7H4V4.5h4L9 3Zm-3.5 5h13l-1 12.2A2 2 0 0 1 15.5 22h-7a2 2 0 0 1-2-1.8L5.5 8Zm4 3v8h1.6v-8H9.5Zm3.4 0v8h1.6v-8h-1.6Z" />
              </svg>
            </button>
          )
        }
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          className="space-y-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <FormErrorAlert title="Couldn't save" message={localError ?? (edited ? null : error)} />

          <div className="space-y-1.5">
            <span className="block text-base font-semibold">Start Date</span>
            <button type="button" onClick={() => setPicker('start')} className={FIELD}>
              {formatDate(start)}
              <ChevronDown aria-hidden="true" className="text-muted-foreground size-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="block text-base font-semibold">End Date</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPicker('end')} className={FIELD}>
                <span className={end ? undefined : 'text-muted-foreground'}>
                  {end ? formatDate(end) : 'Not set'}
                </span>
                <ChevronDown aria-hidden="true" className="text-muted-foreground size-5" />
              </button>
              {end && (
                <button
                  type="button"
                  aria-label="Clear end date"
                  onClick={() => {
                    setEdited(true)
                    setEnd(null)
                  }}
                  className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-14 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              )}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="block text-base font-semibold">Symptoms</span>
            <Textarea
              value={symptoms}
              maxLength={SYMPTOMS_MAX}
              rows={2}
              placeholder="Cramps, headache…"
              onChange={(event) => {
                setEdited(true)
                setSymptoms(event.target.value)
              }}
              className="bg-secondary min-h-14 rounded-lg border-0 px-4 py-3 text-lg"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="block text-base font-semibold">Notes</span>
            <Textarea
              value={notes}
              maxLength={NOTES_MAX}
              rows={3}
              onChange={(event) => {
                setEdited(true)
                setNotes(event.target.value)
              }}
              className="bg-secondary min-h-24 rounded-lg border-0 px-4 py-3 text-lg"
            />
          </label>

          <Button
            type="submit"
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Save
          </Button>
        </form>
      </SheetFrame>

      <SelectDateSheet
        key={`start-${start}`}
        open={picker === 'start'}
        onOpenChange={(next) => !next && setPicker(null)}
        value={start}
        today={today}
        onSelect={chooseStart}
      />
      <SelectDateSheet
        key={`end-${end ?? start}`}
        open={picker === 'end'}
        onOpenChange={(next) => !next && setPicker(null)}
        value={end ?? start}
        today={today}
        isDateEnabled={(iso) => iso >= start}
        onSelect={(date) => {
          setLocalError(null)
          setEdited(true)
          setEnd(date)
        }}
      />
    </>
  )
}

import { Plus } from 'lucide-react'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { SwipeToDelete } from '@/components/shared/SwipeToDelete'
import { Button } from '@/components/ui/button'
import { useExitingList } from '@/hooks/use-exiting-list'
import { cn } from '@/lib/utils'
import { noteColorOf } from '../../notes.config'
import type { FoodLogNote } from '../../types/food-log.types'

interface NotesSectionProps {
  readonly notes: readonly FoodLogNote[]
  readonly onAdd: () => void
  readonly onSelect: (note: FoodLogNote) => void
  /** Vuốt thẻ sang trái để xoá. */
  readonly onDelete: (note: FoodLogNote) => void
  /** Số ghi chú tối đa mỗi ngày (BE trả `notesMaxPerDay`). */
  readonly max: number
}

/**
 * Thẻ ghi chú tối giản như MacroFactor: dòng đậm là tên (không có tên thì chính nội dung), dòng xám là nội dung (tối đa 2 dòng),
 * góc phải dưới là giờ nhỏ xám + chấm màu 8px của ghi chú.
 */
function NoteCard({
  note,
  onSelect,
}: {
  readonly note: FoodLogNote
  readonly onSelect: (note: FoodLogNote) => void
}) {
  const name = note.name?.trim() ?? ''
  const text = note.text.trim()
  const title = name || text
  const body = name ? text : ''
  return (
    <button
      type="button"
      onClick={() => onSelect(note)}
      className="active:bg-muted focus-visible:ring-ring/50 flex w-full items-end gap-3 px-4 py-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
    >
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-lg leading-snug font-semibold break-words whitespace-pre-wrap">
          {title}
        </span>
        {body && (
          <span className="text-muted-foreground line-clamp-2 text-base break-words whitespace-pre-wrap">
            {body}
          </span>
        )}
      </span>
      <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm tabular-nums">
        {note.notedAt?.slice(0, 5)}
        <span
          aria-hidden="true"
          className={cn('size-2 rounded-full', noteColorOf(note.color).dot)}
        />
      </span>
    </button>
  )
}

/**
 * Ghi chú của ngày: tiêu đề + đếm "n / 5" + nút + tròn trắng (khoá mờ khi đủ năm ghi chú, kèm dòng báo lý do), bên dưới là thẻ ghi
 * chú nền card không viền màu (chạm để sửa, vuốt trái để xoá; thẻ mới chèn vào và thẻ xoá thu gọn 300ms) hoặc "No notes to display".
 */
export function NotesSection({ notes, onAdd, onSelect, onDelete, max }: NotesSectionProps) {
  const rows = useExitingList(notes, (note) => note.id)
  const full = notes.length >= max
  return (
    <section aria-labelledby="notes-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="notes-heading" className="text-xl font-bold">
          Notes
        </h2>
        <div className="flex items-center gap-3">
          <span
            aria-label={`${notes.length} of ${max} notes`}
            className={cn(
              'text-sm tabular-nums transition-colors duration-200',
              full ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {notes.length} / {max}
          </span>
          <Button
            aria-label={full ? 'Add note (limit reached)' : 'Add note'}
            aria-disabled={full}
            onClick={() => {
              if (!full) onAdd()
            }}
            className={cn(
              'bg-foreground text-background hover:bg-foreground/90 size-11 rounded-full p-0 transition-[opacity,transform] duration-200 active:scale-95 motion-reduce:active:scale-100',
              full && 'cursor-not-allowed opacity-40'
            )}
          >
            <Plus aria-hidden="true" className="size-6" />
          </Button>
        </div>
      </div>
      {full && (
        <p
          role="status"
          className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 text-sm"
        >
          You can add up to {max} notes per day. Delete one to add another.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl px-4 py-4 text-base">
          No notes to display
        </p>
      ) : (
        <ul>
          {rows.map(({ item: note, key, entering, leaving }) => (
            <CollapseItem key={key} gap entering={entering} leaving={leaving}>
              <SwipeToDelete onDelete={() => onDelete(note)} disabled={leaving}>
                <NoteCard note={note} onSelect={onSelect} />
              </SwipeToDelete>
            </CollapseItem>
          ))}
        </ul>
      )}
    </section>
  )
}

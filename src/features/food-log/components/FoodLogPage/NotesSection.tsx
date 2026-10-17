import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FoodLogNote } from '../../types/food-log.types'

interface NotesSectionProps {
  readonly notes: readonly FoodLogNote[]
  readonly onAdd: () => void
  readonly onSelect: (note: FoodLogNote) => void
}

/** Ghi chú của ngày: tiêu đề + nút + tròn trắng, bên dưới là các ghi chú (chạm để sửa) hoặc "No notes to display". */
export function NotesSection({ notes, onAdd, onSelect }: NotesSectionProps) {
  return (
    <section aria-labelledby="notes-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="notes-heading" className="text-xl font-bold">
          Notes
        </h2>
        <Button
          aria-label="Add note"
          onClick={onAdd}
          className="bg-foreground text-background hover:bg-foreground/90 size-11 rounded-full p-0"
        >
          <Plus aria-hidden="true" className="size-6" />
        </Button>
      </div>
      {notes.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl px-4 py-4 text-base">
          No notes to display
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelect(note)}
                className="bg-card active:bg-muted focus-visible:ring-ring/50 w-full rounded-xl px-4 py-3 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                {note.notedAt && (
                  <span className="text-muted-foreground block text-sm tabular-nums">
                    {note.notedAt.slice(0, 5)}
                  </span>
                )}
                <span className="block whitespace-pre-wrap">{note.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

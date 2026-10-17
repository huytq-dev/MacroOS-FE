'use client'

import { useRef } from 'react'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { TileThumb } from './TileThumb'
import { useFlip } from '../../hooks/use-flip'
import {
  NUTRIENT_DISPLAY_LABEL,
  SECTIONS,
  type NutrientDisplay,
  type SectionKey,
} from '../../dashboard-layout'
import { IconButton } from '@/components/shared/IconButton'
import { cn } from '@/lib/utils'

const ROW_HEIGHT = 64

interface TileListSectionProps {
  readonly section: SectionKey
  readonly tiles: readonly string[]
  readonly display: Readonly<Record<string, NutrientDisplay>>
  readonly canMoveUp: boolean
  readonly canMoveDown: boolean
  readonly onMoveSection: (delta: -1 | 1) => void
  /** Đổi chỗ ô `index` với ô kế bên (kéo hoặc phím mũi tên trên tay cầm). */
  readonly onMoveTile: (index: number, delta: -1 | 1) => void
  readonly onEdit: () => void
  readonly onPickDisplay: (tileKey: string) => void
}

/** Một nhóm trong màn tuỳ chỉnh: tiêu đề + mũi tên dời nhóm, danh sách ô (tay cầm "=" để kéo), nút thêm/bớt. */
export function TileListSection({
  section,
  tiles,
  display,
  canMoveUp,
  canMoveDown,
  onMoveSection,
  onMoveTile,
  onEdit,
  onPickDisplay,
}: TileListSectionProps) {
  const def = SECTIONS[section]
  const byKey = new Map(def.groups.flatMap((group) => group.tiles).map((tile) => [tile.key, tile]))
  const drag = useRef<{ index: number; y: number } | null>(null)
  const row = useFlip(tiles, 'y')

  const handleMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state) return
    const delta = event.clientY - state.y
    if (Math.abs(delta) < ROW_HEIGHT / 2) return
    const direction = delta > 0 ? 1 : -1
    const target = state.index + direction
    if (target < 0 || target >= tiles.length) return
    onMoveTile(state.index, direction)
    drag.current = { index: target, y: event.clientY }
  }

  return (
    <section aria-labelledby={`custom-${section}`} className="space-y-3 px-4">
      <div className="flex items-center justify-between">
        <h2 id={`custom-${section}`} className="text-lg font-bold">
          {def.title}
        </h2>
        <div className="flex gap-1">
          <IconButton
            icon={ArrowUp}
            label={`Move ${def.title} up`}
            className="size-11"
            disabled={!canMoveUp}
            onClick={() => onMoveSection(-1)}
          />
          <IconButton
            icon={ArrowDown}
            label={`Move ${def.title} down`}
            className="size-11"
            disabled={!canMoveDown}
            onClick={() => onMoveSection(1)}
          />
        </div>
      </div>
      <div className="bg-card overflow-hidden rounded-xl">
        <ul className="relative">
          {tiles.map((key, index) => {
            const tile = byKey.get(key)
            if (!tile) return null
            return (
              <li key={key} ref={row(key)} className="flex items-center gap-4 pl-4">
                <TileThumb kind={tile.thumb} color={tile.color} />
                <div
                  className={cn(
                    'border-foreground/10 flex min-h-14 flex-1 items-center gap-2 pr-3',
                    index > 0 && 'border-t'
                  )}
                >
                  <span className="flex-1 text-base">{tile.label}</span>
                  {def.hasDisplayMode && tile.thumb !== 'macros' && (
                    <button
                      type="button"
                      onClick={() => onPickDisplay(key)}
                      aria-label={`Display mode for ${tile.label}`}
                      className="text-muted-foreground focus-visible:ring-ring/50 flex min-h-11 items-center gap-1 text-base focus-visible:ring-1 focus-visible:outline-none"
                    >
                      {NUTRIENT_DISPLAY_LABEL[display[key] ?? 'consumed']}
                      <ChevronDown aria-hidden="true" className="size-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Drag to reorder ${tile.label}`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId)
                      drag.current = { index, y: event.clientY }
                    }}
                    onPointerMove={handleMove}
                    onPointerUp={() => (drag.current = null)}
                    onPointerCancel={() => (drag.current = null)}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                      event.preventDefault()
                      onMoveTile(index, event.key === 'ArrowUp' ? -1 : 1)
                    }}
                    className="focus-visible:ring-ring/50 flex size-11 touch-none items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <span aria-hidden="true" className="flex w-4 flex-col gap-1">
                      <span className="bg-foreground h-[2.5px] rounded-full" />
                      <span className="bg-foreground h-[2.5px] rounded-full" />
                    </span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="p-3">
          <button
            type="button"
            onClick={onEdit}
            className="bg-foreground/15 active:bg-foreground/25 focus-visible:ring-ring/50 flex min-h-12 w-full items-center justify-center rounded-lg text-base transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            {def.editLabel}
          </button>
        </div>
      </div>
    </section>
  )
}

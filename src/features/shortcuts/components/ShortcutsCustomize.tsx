'use client'

import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { SlidingSwitch } from '@/features/food-log/components/FoodLogPage/SlidingSwitch'
import {
  ChoiceSheet,
  SettingRow,
  SettingsSection,
  ToggleList,
} from '@/features/food-log/components/FoodLogSettingsPage'
import { DEFAULT_SHORTCUTS, shortcutMeta, TOOLBAR_STYLES } from '../shortcuts.config'
import type {
  ShortcutColor,
  ShortcutConfig,
  ShortcutItem,
  ToolbarStyle,
} from '../types/shortcuts.types'
import { ChooseColorSheet } from './ChooseColorSheet'
import { ShortcutToolbarContent } from './ShortcutToolbarContent'
import { SortableShortcutRow } from './SortableShortcutRow'

type Mode = 'order' | 'color'

const MODES = [
  { value: 'order', label: 'Order' },
  { value: 'color', label: 'Color' },
] as const

const TOP_COUNT = 4

interface ShortcutsCustomizeProps {
  /** Cấu hình đang lưu (đã tải xong); form bắt đầu từ bản này. */
  readonly initial: ShortcutConfig
  readonly isSaving: boolean
  readonly error: string | null
  readonly onSave: (draft: { toolbarStyle: ToolbarStyle; items: ShortcutItem[] }) => void
  readonly onExit: () => void
}

/** So theo nội dung (khoá, bật, màu, thứ tự) chứ không theo thứ tự trường của JSON, để "về đúng bản đã lưu" mới tính là chưa đổi. */
const draftSignature = (draft: { toolbarStyle: ToolbarStyle; items: readonly ShortcutItem[] }) =>
  `${draft.toolbarStyle}|${draft.items.map((item) => `${item.key}:${item.enabled}:${item.color ?? ''}`).join(',')}`

const labelOf = (id: string | number) => shortcutMeta(String(id))?.label ?? String(id)

/** Bộ đọc màn hình cho thao tác kéo (tiếng Anh, vị trí tính từ 1 trong các shortcut đang bật). */
const announcementsOf = (keys: readonly string[]): Announcements => {
  const where = (id: string | number | undefined) =>
    id === undefined ? '' : ` Position ${keys.indexOf(String(id)) + 1} of ${keys.length}.`
  return {
    onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.${where(active.id)}`,
    onDragOver: ({ active, over }) =>
      over ? `${labelOf(active.id)} is over ${labelOf(over.id)}.${where(over.id)}` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} was dropped.${where(over.id)}`
        : `${labelOf(active.id)} was dropped. Order unchanged.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. ${labelOf(active.id)} returned to its place.`,
  }
}

/**
 * Trang Customize (`/shortcuts`): preview toolbar + Toolbar Style (sheet chọn một), danh sách shortcut với Order | Color (Order: kéo-thả
 * bằng tay cầm "=" (dnd-kit) — bốn dòng đầu là "Top Shortcut", Add or Remove Shortcuts, Reset to App Defaults; Color: nút cọ mở Choose Color),
 * Save góc phải. Thoát khi có thay đổi chưa lưu thì hỏi "Exit Without Saving?". Mọi thay đổi nằm trong bản nháp cho tới khi Save.
 */
export function ShortcutsCustomize({
  initial,
  isSaving,
  error,
  onSave,
  onExit,
}: ShortcutsCustomizeProps) {
  const [style, setStyle] = useState<ToolbarStyle>(initial.toolbarStyle)
  const [items, setItems] = useState<ShortcutItem[]>(initial.items)
  const [mode, setMode] = useState<Mode>('order')
  const [styleOpen, setStyleOpen] = useState(false)
  const [chooseOpen, setChooseOpen] = useState(false)
  const [colorKey, setColorKey] = useState<string | null>(null)
  const [exitOpen, setExitOpen] = useState(false)

  const enabled = items.filter((item) => item.enabled)
  const need = Math.max(1, TOOLBAR_STYLES.find((option) => option.value === style)?.minEnabled ?? 1)
  const valid = enabled.length >= need
  const dirty = draftSignature({ toolbarStyle: style, items }) !== draftSignature(initial)

  const enabledKeys = enabled.map((item) => item.key)
  // Kéo bằng chuột / chạm giữ 150 ms (cuộn trang không bị kéo nhầm) hoặc bàn phím (Space rồi mũi tên)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  // Nhãn "Top Shortcut" chạy theo vị trí đang kéo, không đợi thả
  const [drag, setDrag] = useState<{ active: string; over: string } | null>(null)
  const shownKeys = (() => {
    if (!drag) return enabledKeys
    const from = enabledKeys.indexOf(drag.active)
    const to = enabledKeys.indexOf(drag.over)
    return from < 0 || to < 0 ? enabledKeys : arrayMove(enabledKeys, from, to)
  })()
  const onDragStart = ({ active }: DragStartEvent) =>
    setDrag({ active: String(active.id), over: String(active.id) })
  const onDragOver = ({ active, over }: DragOverEvent) =>
    setDrag({ active: String(active.id), over: String(over?.id ?? active.id) })
  /** Sắp lại các shortcut đang bật; các mục tắt giữ nguyên chỗ trong danh sách đầy đủ. */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDrag(null)
    if (!over || active.id === over.id) return
    setItems((current) => {
      const live = current.filter((item) => item.enabled)
      const from = live.findIndex((item) => item.key === active.id)
      const to = live.findIndex((item) => item.key === over.id)
      if (from < 0 || to < 0) return current
      const moved = arrayMove(live, from, to)
      let next = 0
      return current.map((item) => (item.enabled ? moved[next++] : item))
    })
  }
  const setColor = (key: string, color: ShortcutColor | null) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, color } : item)))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-10">
      <SubPageHeader
        title="Shortcuts"
        onBack={() => (dirty ? setExitOpen(true) : onExit())}
        action={
          <Button
            className="h-11 rounded-full px-5 text-base"
            disabled={!dirty || !valid || isSaving}
            aria-busy={isSaving}
            onClick={() => onSave({ toolbarStyle: style, items })}
          >
            Save
          </Button>
        }
      />
      <FormErrorAlert title="Couldn't save shortcuts" message={error} />

      <SettingsSection title="Toolbar">
        <div
          key={style}
          aria-hidden="true"
          inert
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 flex min-h-[4.5rem] items-center gap-3 px-4 py-3"
        >
          {style === 'None' ? (
            <p className="text-muted-foreground w-full text-center text-sm">No toolbar</p>
          ) : (
            <ShortcutToolbarContent
              style={style}
              items={items}
              onSearch={() => undefined}
              onScan={() => undefined}
              onRun={() => undefined}
            />
          )}
        </div>
        <SettingRow
          title="Toolbar Style"
          detail={TOOLBAR_STYLES.find((option) => option.value === style)?.label ?? ''}
          onEdit={() => setStyleOpen(true)}
        />
      </SettingsSection>
      {!valid && (
        <p role="alert" className="text-destructive -mt-3 text-sm">
          This toolbar style needs at least {need} enabled shortcuts.
        </p>
      )}

      <section aria-labelledby="shortcut-list" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="shortcut-list" className="text-xl font-bold">
            Shortcuts
          </h2>
          <SlidingSwitch
            options={MODES}
            value={mode}
            onChange={setMode}
            label="Customize mode"
            className="bg-card"
          />
        </div>
        <DndContext
          id="shortcuts-order"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          accessibility={{ announcements: announcementsOf(enabledKeys) }}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDrag(null)}
        >
          <SortableContext items={enabledKeys} strategy={verticalListSortingStrategy}>
            <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
              {enabled.map((item) => (
                <SortableShortcutRow
                  key={item.key}
                  item={item}
                  top={shownKeys.indexOf(item.key) < TOP_COUNT}
                  mode={mode}
                  onChooseColor={() => setColorKey(item.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {mode === 'order' && (
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="h-12 w-full rounded-full text-base"
              onClick={() => setChooseOpen(true)}
            >
              Add or Remove Shortcuts
            </Button>
            <Button
              variant="secondary"
              className="text-destructive h-12 w-full rounded-full text-base"
              onClick={() => {
                setStyle(DEFAULT_SHORTCUTS.toolbarStyle)
                setItems(DEFAULT_SHORTCUTS.items)
              }}
            >
              Reset to App Defaults
            </Button>
          </div>
        )}
      </section>

      <ChoiceSheet
        open={styleOpen}
        onOpenChange={setStyleOpen}
        title="Toolbar Style"
        choices={TOOLBAR_STYLES.map((option) => ({ value: option.value, label: option.label }))}
        value={style}
        onSelect={(value) => {
          const option = TOOLBAR_STYLES.find((candidate) => candidate.value === value)
          if (option) setStyle(option.value)
        }}
      />

      <SheetFrame open={chooseOpen} onOpenChange={setChooseOpen} title="Choose Shortcuts">
        <div className="px-4 pt-4 pb-2">
          <ToggleList
            label="Shortcuts"
            items={items.flatMap((item) => {
              const meta = shortcutMeta(item.key)
              return meta ? [{ key: item.key, label: meta.label, checked: item.enabled }] : []
            })}
            onToggle={(key, checked) =>
              setItems((current) =>
                current.map((item) => (item.key === key ? { ...item, enabled: checked } : item))
              )
            }
          />
        </div>
      </SheetFrame>

      <ChooseColorSheet
        open={colorKey !== null}
        onOpenChange={(open) => !open && setColorKey(null)}
        value={items.find((item) => item.key === colorKey)?.color ?? null}
        onSelect={(color) => colorKey && setColor(colorKey, color)}
      />

      <ConfirmDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        title="Exit Without Saving?"
        description="Your changes to shortcuts will be lost."
        confirmLabel="Exit"
        pendingLabel="Exiting..."
        isPending={false}
        onConfirm={onExit}
      />
    </div>
  )
}

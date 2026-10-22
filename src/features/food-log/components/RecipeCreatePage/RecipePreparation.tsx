'use client'

import { Equal, Flame, Loader2, Plus } from 'lucide-react'
import { Energy } from '@/components/shared/Energy'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { FoodIcon } from '@/components/shared/FoodIcon'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SwipeToDelete } from '@/components/shared/SwipeToDelete'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useExitingList } from '@/hooks/use-exiting-list'
import { cn } from '@/lib/utils'
import { KeypadField } from './KeypadField'
import type { NumberField } from './RecipeForm'

export const DESCRIPTION_MAX = 1500

export interface RecipeStep {
  readonly id: string
  readonly text: string
}

interface IconLike {
  readonly iconKey?: string | null
  readonly emoji?: string | null
}

interface RecipePreparationProps {
  readonly name: string
  /** Macro của một khẩu phần để hiện trên thẻ "Your New Recipe"; null khi chưa tính xong. */
  readonly macros: {
    readonly calories: number
    readonly protein: number
    readonly fat: number
    readonly carbs: number
  } | null
  readonly servingsLabel: string
  /** Icon đã chọn (khoá); null = xếp chồng icon nguyên liệu. */
  readonly iconKey: string | null
  readonly ingredientIcons: readonly IconLike[]
  readonly onEditIcon: () => void
  readonly prep: string
  readonly cook: string
  readonly activeField: NumberField | null
  readonly onFieldPress: (field: NumberField, button: HTMLElement) => void
  readonly link: string
  readonly onLinkChange: (value: string) => void
  readonly description: string
  readonly onDescriptionChange: (value: string) => void
  /** Ô chữ nhận focus: đóng bàn phím số riêng. */
  readonly onTextFocus: () => void
  readonly steps: readonly RecipeStep[]
  readonly onAddStep: () => void
  readonly onEditStep: (id: string) => void
  readonly onRemoveStep: (id: string) => void
  readonly onReorderSteps: (from: number, to: number) => void
  readonly onCreateAndAdd: () => void
  readonly onCreate: () => void
  /** Lệnh đang gửi: nút tương ứng hiện spinner, cả hai khoá. */
  readonly pending: 'create' | 'add' | null
  readonly error: string | null
  /** Bàn phím số đang mở: ẩn hai nút Create và chừa chỗ cuối trang. */
  readonly editorOpen: boolean
}

const FIELD =
  'bg-secondary h-14 rounded-lg border-0 px-4 text-base shadow-none focus-visible:ring-1'

/** Icon của recipe: đã chọn thì một icon, chưa thì tối đa ba icon nguyên liệu xếp chồng (như MacroFactor). */
function RecipeIcon({
  iconKey,
  ingredientIcons,
}: {
  readonly iconKey: string | null
  readonly ingredientIcons: readonly IconLike[]
}) {
  if (iconKey) return <FoodIcon iconKey={iconKey} size={48} />
  const stack = ingredientIcons.slice(0, 3)
  return (
    <span className="relative size-12 shrink-0" aria-hidden="true">
      {stack.map((icon, index) => (
        <span
          key={index}
          className={cn(
            'bg-card border-border absolute flex size-7 items-center justify-center rounded-full border',
            index === 0 && 'top-0 left-2.5',
            index === 1 && 'bottom-0 left-0',
            index === 2 && 'right-0 bottom-0'
          )}
        >
          <FoodIcon iconKey={icon.iconKey} emoji={icon.emoji ?? null} size={20} />
        </span>
      ))}
    </span>
  )
}

/** Một bước: tay cầm "=" để kéo sắp xếp, chạm để sửa, vuốt trái để xoá. */
function SortableStep({
  step,
  number,
  onEdit,
  onRemove,
}: {
  readonly step: RecipeStep
  readonly number: number
  readonly onEdit: () => void
  readonly onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1 motion-reduce:transition-none!',
        isDragging && 'relative z-10 shadow-lg'
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Reorder step ${number}`}
        {...attributes}
        {...listeners}
        className="text-muted-foreground focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full transition-colors select-none focus-visible:ring-1 focus-visible:outline-none active:cursor-grabbing"
      >
        <Equal aria-hidden="true" className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <SwipeToDelete onDelete={onRemove}>
          <button
            type="button"
            onClick={onEdit}
            className="active:bg-muted focus-visible:ring-ring/50 flex w-full items-start gap-3 px-4 py-3 text-left text-base transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
          >
            <span className="text-muted-foreground w-5 shrink-0 tabular-nums">{number}</span>
            <span className="line-clamp-3 min-w-0 flex-1 break-words whitespace-pre-wrap">
              {step.text}
            </span>
          </button>
        </SwipeToDelete>
      </div>
    </div>
  )
}

/**
 * Bước 2 "Preparation (optional)" (như MacroFactor): thẻ "Your New Recipe" (icon, tên, macro một khẩu phần, nút Edit Icon), Preparation
 * Time / Cooking Time (bàn phím số riêng, phút), Link, Description 0/1500, Steps (+ mở bảng Step N; chạm để sửa, vuốt trái để xoá, kéo
 * "=" để sắp xếp; thêm / xoá thu gọn 300ms) và hai nút dính đáy: Create & Add (tạo rồi ghi vào log) và Create.
 */
export function RecipePreparation({
  name,
  macros,
  servingsLabel,
  iconKey,
  ingredientIcons,
  onEditIcon,
  prep,
  cook,
  activeField,
  onFieldPress,
  link,
  onLinkChange,
  description,
  onDescriptionChange,
  onTextFocus,
  steps,
  onAddStep,
  onEditStep,
  onRemoveStep,
  onReorderSteps,
  onCreateAndAdd,
  onCreate,
  pending,
  error,
  editorOpen,
}: RecipePreparationProps) {
  const rows = useExitingList(steps, (step) => step.id)
  // Kéo bằng chuột / chạm giữ 150 ms (cuộn trang không bị kéo nhầm) hoặc bàn phím (Space rồi mũi tên)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = steps.map((step) => step.id)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorderSteps(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
  }
  const busy = pending !== null

  return (
    <div
      className="flex flex-col gap-6"
      style={{ paddingBottom: editorOpen ? '22rem' : undefined }}
    >
      <h2 className="text-3xl font-bold">Preparation (optional)</h2>
      <FormErrorAlert title="Couldn't save the recipe" message={error} />

      <section aria-labelledby="recipe-card" className="space-y-2">
        <h3 id="recipe-card" className="text-lg font-normal">
          Your New Recipe
        </h3>
        <div className="border-border flex items-center gap-3 rounded-xl border-2 py-3 pr-3 pl-4">
          <RecipeIcon iconKey={iconKey} ingredientIcons={ingredientIcons} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base leading-snug font-medium">{name}</p>
            <p className="text-muted-foreground flex items-center gap-x-1.5 text-[13px] whitespace-nowrap tabular-nums">
              {macros ? (
                <>
                  <span className="inline-flex items-center">
                    <Energy kcal={macros.calories} />
                    <Flame aria-hidden="true" fill="currentColor" className="size-3.5" />
                  </span>
                  <span>{Math.round(macros.protein)}P</span>
                  <span>{Math.round(macros.fat)}F</span>
                  <span>{Math.round(macros.carbs)}C</span>
                  <span className="truncate">• {servingsLabel}</span>
                </>
              ) : (
                <span>{servingsLabel}</span>
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onEditIcon}
            className="h-11 shrink-0 rounded-full px-4 text-base transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
          >
            Edit Icon
          </Button>
        </div>
      </section>

      <KeypadField
        label="Preparation Time"
        value={prep}
        placeholder="Enter preparation time"
        suffix="min"
        active={activeField === 'prep'}
        onPress={(button) => onFieldPress('prep', button)}
      />
      <KeypadField
        label="Cooking Time"
        value={cook}
        placeholder="Enter cooking time"
        suffix="min"
        active={activeField === 'cook'}
        onPress={(button) => onFieldPress('cook', button)}
      />

      <div className="space-y-2">
        <label htmlFor="recipe-link" className="block text-lg">
          Link
        </label>
        <Input
          id="recipe-link"
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          maxLength={500}
          placeholder="Enter link to the recipe"
          value={link}
          onFocus={onTextFocus}
          onChange={(event) => onLinkChange(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="recipe-description" className="text-lg">
            Description
          </label>
          <span className="text-muted-foreground text-base tabular-nums">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <Textarea
          id="recipe-description"
          maxLength={DESCRIPTION_MAX}
          rows={3}
          placeholder="Describe the recipe"
          value={description}
          onFocus={onTextFocus}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="bg-secondary min-h-28 rounded-lg border-0 px-4 py-3 text-base shadow-none focus-visible:ring-1"
        />
      </div>

      <section aria-labelledby="recipe-steps" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id="recipe-steps" className="text-lg font-normal">
              Steps
            </h3>
            <p className="text-muted-foreground text-base">Add preparation steps</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            aria-label="Add step"
            disabled={steps.length >= 50}
            onClick={onAddStep}
            className="size-14 shrink-0 rounded-full p-0 transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
          >
            <Plus aria-hidden="true" className="size-6" />
          </Button>
        </div>
        {rows.length > 0 && (
          <DndContext
            id="recipe-steps-order"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul>
                {rows.map(({ item: step, key, entering, leaving }) => (
                  <CollapseItem key={key} gap entering={entering} leaving={leaving}>
                    <SortableStep
                      step={step}
                      number={ids.indexOf(step.id) + 1 || rows.length}
                      onEdit={() => onEditStep(step.id)}
                      onRemove={() => onRemoveStep(step.id)}
                    />
                  </CollapseItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {!editorOpen && (
        <div className="bg-background sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 space-y-2 px-4 pt-2 pb-3 in-data-[keyboard=open]:bottom-(--kb-bottom)">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            aria-busy={pending === 'add'}
            onClick={onCreateAndAdd}
            className="h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {pending === 'add' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {pending === 'add' ? 'Saving...' : 'Create & Add'}
          </Button>
          <Button
            type="button"
            disabled={busy}
            aria-busy={pending === 'create'}
            onClick={onCreate}
            className="h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {pending === 'create' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {pending === 'create' ? 'Saving...' : 'Create'}
          </Button>
        </div>
      )}
    </div>
  )
}

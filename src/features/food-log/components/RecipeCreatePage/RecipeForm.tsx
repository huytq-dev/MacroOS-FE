'use client'

import { Loader2, Plus } from 'lucide-react'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExitingList } from '@/hooks/use-exiting-list'
import { RecipeIngredientRow, type IngredientRowData } from './RecipeIngredientRow'

export interface RecipeFormLine extends IngredientRowData {
  readonly key: string
}

interface RecipeFormProps {
  readonly name: string
  readonly onNameChange: (value: string) => void
  readonly servings: string
  readonly onServingsChange: (value: string) => void
  readonly lines: readonly RecipeFormLine[]
  /** Tổng khối lượng nguyên liệu (g) đã biết; null khi chưa có dòng nào. */
  readonly totalGrams: number | null
  readonly editingKey: string | null
  readonly onEditLine: (key: string, button: HTMLElement) => void
  readonly onRemoveLine: (key: string) => void
  readonly onAddIngredient: () => void
  /** Ô chữ nhận focus: đóng thanh sửa lượng (bàn phím hệ thống thay thế). */
  readonly onTextFocus: () => void
  readonly onSubmit: () => void
  readonly isSubmitting: boolean
  readonly error: string | null
  /** Thanh sửa lượng đang mở: ẩn nút lưu và chừa chỗ để nội dung không bị bàn phím che. */
  readonly editorOpen: boolean
}

const FIELD =
  'bg-secondary h-14 rounded-lg border-0 px-4 text-base shadow-none focus-visible:ring-1'

/**
 * Form "Build your recipe" (như MacroFactor): Recipe Name và Serving Quantity (bắt buộc), "Ingredients" kèm tổng khối lượng
 * nguyên liệu và nút + mở tìm món, danh sách nguyên liệu (bấm ô lượng để sửa, vuốt trái để xoá; thêm / xoá có hoạt ảnh 300ms) và nút
 * lưu dính đáy trên thanh tab.
 */
export function RecipeForm({
  name,
  onNameChange,
  servings,
  onServingsChange,
  lines,
  totalGrams,
  editingKey,
  onEditLine,
  onRemoveLine,
  onAddIngredient,
  onTextFocus,
  onSubmit,
  isSubmitting,
  error,
  editorOpen,
}: RecipeFormProps) {
  const rows = useExitingList(lines, (line) => line.key)
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-6"
      // Thanh sửa lượng (chip + bàn phím số ~22rem) cố định đáy màn hình: chừa chỗ để dòng cuối không bị che
      style={{ paddingBottom: editorOpen ? '22rem' : undefined }}
    >
      <h2 className="text-3xl font-bold">Build your recipe</h2>
      <FormErrorAlert title="Couldn't save the recipe" message={error} />

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="recipe-name" className="text-lg">
            Recipe Name
          </label>
          <span className="text-muted-foreground text-base">Required</span>
        </div>
        <Input
          id="recipe-name"
          autoComplete="off"
          placeholder="Enter recipe name"
          maxLength={256}
          value={name}
          onFocus={onTextFocus}
          onChange={(event) => onNameChange(event.target.value)}
          className={FIELD}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="recipe-servings" className="text-lg">
            Serving Quantity
          </label>
          <span className="text-muted-foreground text-base">Required</span>
        </div>
        <Input
          id="recipe-servings"
          inputMode="numeric"
          autoComplete="off"
          value={servings}
          onFocus={onTextFocus}
          onChange={(event) => onServingsChange(event.target.value.replace(/\D/g, '').slice(0, 3))}
          className={FIELD}
        />
      </div>

      <section aria-labelledby="recipe-ingredients" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id="recipe-ingredients" className="text-xl font-bold">
              Ingredients
            </h3>
            <p className="text-muted-foreground text-base tabular-nums">
              Weight of ingredients is {totalGrams === null ? '0' : Number(totalGrams.toFixed(1))} g
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            aria-label="Add ingredient"
            onClick={onAddIngredient}
            className="size-14 shrink-0 rounded-full p-0 transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
          >
            <Plus aria-hidden="true" className="size-6" />
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-xl px-4 py-4 text-base">
            No ingredients yet. Tap + to add foods.
          </p>
        ) : (
          <ul>
            {rows.map(({ item: line, key, entering, leaving }) => (
              <CollapseItem key={key} gap entering={entering} leaving={leaving}>
                <RecipeIngredientRow
                  data={line}
                  editing={editingKey === line.key}
                  onEdit={(button) => onEditLine(line.key, button)}
                  onRemove={() => onRemoveLine(line.key)}
                />
              </CollapseItem>
            ))}
          </ul>
        )}
      </section>

      {!editorOpen && (
        <div className="bg-background sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 px-4 pt-2 pb-3 in-data-[keyboard=open]:bottom-(--kb-bottom)">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save recipe'}
          </Button>
        </div>
      )}
    </form>
  )
}

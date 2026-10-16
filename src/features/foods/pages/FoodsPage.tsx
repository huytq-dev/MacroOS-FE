'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import {
  useCreateFood,
  useDeleteFood,
  useFoodDetail,
  useFoodSearch,
  useUpdateFood,
} from '../hooks/use-foods'
import { customFoodSchema, type CustomFoodFormValues } from '../schemas/custom-food.schema'
import { FoodList } from '../components/FoodList'
import { CustomFoodDialog, FoodDetailDialog } from '../components/FoodsPage'
import type { CustomFoodRequest, FoodDetail } from '../types/food.types'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FOOD_SCOPE, enumOptions, type FoodScope } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { getFormErrorMessage } from '@/features/auth/auth.utils'

const PAGE_STEP = 25
const scopeOptions = enumOptions(FOOD_SCOPE)

const emptyForm: CustomFoodFormValues = {
  name: '',
  brand: '',
  category: 'Other',
  caloriesPer100g: Number.NaN,
  proteinPer100g: Number.NaN,
  carbsPer100g: Number.NaN,
  fatPer100g: Number.NaN,
  servingName: '',
  servingGrams: undefined,
}

export function FoodsPage() {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<FoodScope>('All')
  const [top, setTop] = useState(PAGE_STEP)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FoodDetail | null>(null)

  const debouncedSearch = useDebounce(search.trim(), 300)
  const foods = useFoodSearch({ search: debouncedSearch || undefined, scope, top })
  const detail = useFoodDetail(selectedId)
  const createFood = useCreateFood()
  const updateFood = useUpdateFood()
  const deleteFood = useDeleteFood()

  const form = useForm<CustomFoodFormValues>({
    resolver: zodResolver(customFoodSchema),
    mode: 'onTouched',
    defaultValues: emptyForm,
  })
  const saveError = createFood.error ?? updateFood.error
  const isFiltered = Boolean(debouncedSearch) || scope !== 'All'

  const openCreate = () => {
    form.reset(emptyForm)
    createFood.reset()
    updateFood.reset()
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (food: FoodDetail) => {
    form.reset({
      name: food.name,
      brand: food.brand ?? '',
      category: food.category,
      caloriesPer100g: food.nutrition.caloriesPer100g,
      proteinPer100g: food.nutrition.proteinPer100g,
      carbsPer100g: food.nutrition.carbsPer100g,
      fatPer100g: food.nutrition.fatPer100g,
      servingName: '',
      servingGrams: undefined,
    })
    createFood.reset()
    updateFood.reset()
    setEditingId(food.id)
    setSelectedId(null)
    setFormOpen(true)
  }

  const onSubmit = (values: CustomFoodFormValues) => {
    const payload: CustomFoodRequest = {
      name: values.name.trim(),
      brand: values.brand?.trim() || null,
      category: values.category,
      barcode: null,
      nutrition: {
        caloriesPer100g: values.caloriesPer100g,
        proteinPer100g: values.proteinPer100g,
        carbsPer100g: values.carbsPer100g,
        fatPer100g: values.fatPer100g,
      },
      // Bỏ trống khẩu phần: tạo mới → BE tự thêm "100 g"; sửa → giữ khẩu phần cũ
      servings:
        values.servingName?.trim() && values.servingGrams
          ? [
              {
                servingName: values.servingName.trim(),
                weightInGrams: values.servingGrams,
                isDefault: true,
              },
            ]
          : null,
    }
    const onSuccess = () => setFormOpen(false)
    if (editingId) updateFood.mutate({ id: editingId, payload }, { onSuccess })
    else createFood.mutate(payload, { onSuccess })
  }

  const clearFilters = () => {
    setSearch('')
    setScope('All')
    setTop(PAGE_STEP)
  }

  if (foods.isError) return <ErrorState error={foods.error} onRetry={() => void foods.refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold">Thực phẩm</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus aria-hidden="true" /> Tạo món
        </Button>
      </div>

      <SearchInput
        aria-label="Tìm thực phẩm"
        placeholder="Tìm theo tên hoặc thương hiệu"
        value={search}
        onValueChange={(value) => {
          setSearch(value)
          setTop(PAGE_STEP)
        }}
      />

      <ToggleGroup
        type="single"
        value={scope}
        onValueChange={(next) => {
          if (!next) return
          setScope(next as FoodScope)
          setTop(PAGE_STEP)
        }}
        aria-label="Phạm vi thực phẩm"
        spacing={2}
        className="justify-start overflow-x-auto"
      >
        {scopeOptions.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            variant="outline"
            className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-9 shrink-0 rounded-full px-4 text-sm"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Card className="gap-0 overflow-hidden rounded-2xl py-0">
        <FoodList
          items={foods.data?.items ? [...foods.data.items] : []}
          totalCount={foods.data?.totalCount ?? null}
          isLoading={foods.isLoading}
          isFetching={foods.isFetching}
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden="true" /> Tạo món
            </Button>
          }
          onSelect={(food) => setSelectedId(food.id)}
          onLoadMore={() => setTop((current) => current + PAGE_STEP)}
        />
      </Card>

      <FoodDetailDialog
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        food={detail.data ?? undefined}
        isLoading={detail.isLoading}
        onEdit={openEdit}
        onRequestDelete={setDeleteTarget}
      />
      <CustomFoodDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isEdit={editingId !== null}
        form={form}
        isPending={createFood.isPending || updateFood.isPending}
        error={saveError ? getFormErrorMessage(saveError) : null}
        onSubmit={onSubmit}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá thực phẩm?"
        description={
          deleteTarget
            ? `Xoá "${deleteTarget.name}" khỏi thư viện của bạn. Các lần đã log trước đây vẫn giữ nguyên dinh dưỡng.`
            : ''
        }
        confirmLabel="Xoá thực phẩm"
        pendingLabel="Đang xoá..."
        isPending={deleteFood.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteFood.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null)
              setSelectedId(null)
            },
          })
        }
      />
    </div>
  )
}

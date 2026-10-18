'use client'

import { ChooseIconSheet } from '@/components/shared/ChooseIconSheet'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { Skeleton } from '@/components/ui/skeleton'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useFoodDetail } from '@/features/foods/hooks/use-foods'
import type { FoodDetail } from '@/features/foods/types/food.types'
import { useSheet } from '@/hooks/use-sheet'
import {
  FormFooter,
  GeneralSection,
  NutritionSection,
  ServingSection,
} from '../components/CreateFoodPage'
import { useCreateFoodForm } from '../hooks/use-create-food-form'
import type { MacroSeed } from '../create-food.utils'

function CreateFoodBody({
  source,
  seed,
}: {
  readonly source?: FoodDetail
  readonly seed?: MacroSeed
}) {
  const form = useCreateFoodForm(source, seed)
  const iconSheet = useSheet<true>()
  const { state, errors } = form
  return (
    <>
      <FormErrorAlert title="Couldn't create the food" message={form.serverError} />
      <GeneralSection
        name={state.name}
        brand={state.brand}
        barcode={state.barcode}
        iconKey={state.iconKey}
        errors={errors}
        onChange={form.patch}
        onEditIcon={() => iconSheet.show(true)}
      />
      <ServingSection
        state={state}
        errors={errors}
        onBasisChange={form.setBasis}
        onChange={form.patch}
      />
      <NutritionSection
        state={state}
        errors={errors}
        onModeChange={(mode) => form.patch({ mode })}
        onValue={form.setValue}
        onUnit={form.setUnit}
      />
      <FormFooter
        isPending={form.isPending}
        onCreate={() => void form.submit(false)}
        onCreateAndAdd={() => void form.submit(true)}
      />
      {iconSheet.value && (
        <ChooseIconSheet
          key={iconSheet.id}
          open={iconSheet.open}
          onOpenChange={iconSheet.onOpenChange}
          value={state.iconKey}
          onSelect={(iconKey) => form.patch({ iconKey })}
        />
      )}
    </>
  )
}

/**
 * Trang Create Food (kiểu MacroFactor): General Information, Serving Information, Nutrition Information (đủ mọi chất) và hai nút
 * Create / Create & Add. Vào từ "To Custom" thì `fromFoodId` là món nguồn: điền sẵn mọi trường từ món đó. Món nguồn đang tải thì
 * hiện khung chờ, form chỉ dựng sau khi có dữ liệu để trạng thái khởi tạo đúng ngay lần đầu.
 */
export function CreateFoodPage({
  fromFoodId,
  seed,
}: {
  readonly fromFoodId?: string
  /** Macro điền sẵn khi "To Custom" từ một dòng log không có món trong thư viện. */
  readonly seed?: MacroSeed
}) {
  const source = useFoodDetail(fromFoodId ?? null)
  const loading = Boolean(fromFoodId) && source.isPending
  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-4">
      {/* Tiêu đề dính đầu trang với đường trắng mảnh bên dưới (như MacroFactor); nền che nội dung cuộn qua */}
      <div className="bg-background sticky top-0 z-30 space-y-2 pb-1 max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:px-4 max-md:pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <SubPageHeader title="Create Food" />
        <span aria-hidden="true" className="bg-foreground block h-0.5 rounded-full" />
      </div>
      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : (
        <CreateFoodBody
          key={source.data?.id ?? 'blank'}
          source={source.data ?? undefined}
          seed={seed}
        />
      )}
    </div>
  )
}

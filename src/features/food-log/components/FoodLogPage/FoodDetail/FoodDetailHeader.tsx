import { ChevronLeft, X } from 'lucide-react'

interface FoodDetailHeaderProps {
  readonly name: string
  readonly brand: string | null
  readonly onBack: () => void
  /** back = mũi tên quay lại kết quả (thêm món); close = dấu X đóng màn (sửa món đã log). */
  readonly icon?: 'back' | 'close'
}

/** Đầu màn Food Detail: nút quay lại/đóng bên trái, tên món căn giữa (cắt "…"), nhãn hiệu nhỏ bên dưới nếu có. */
export function FoodDetailHeader({ name, brand, onBack, icon = 'back' }: FoodDetailHeaderProps) {
  return (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 pt-3">
      <button
        type="button"
        aria-label={icon === 'close' ? 'Close' : 'Back to results'}
        onClick={onBack}
        className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        {icon === 'close' ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <ChevronLeft aria-hidden="true" className="size-6" />
        )}
      </button>
      <div className="min-w-0 text-center">
        <h2 className="truncate text-lg leading-tight font-semibold">{name}</h2>
        {brand && <p className="text-muted-foreground truncate text-sm">{brand}</p>}
      </div>
      <span aria-hidden="true" />
    </header>
  )
}

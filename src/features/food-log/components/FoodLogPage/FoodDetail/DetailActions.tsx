import { CircleMinus, Heart, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Nút nhỏ: ô vuông bo góc chứa icon, nhãn nằm dưới ô (như MacroFactor). */
const TILE =
  'group flex flex-col items-center gap-1.5 text-sm focus-visible:outline-none disabled:opacity-50'
const TILE_ICON =
  'bg-secondary group-focus-visible:ring-ring/50 group-active:bg-foreground/20 flex size-12 items-center justify-center rounded-xl transition-[background-color,transform] duration-200 group-focus-visible:ring-1 group-active:scale-95 motion-reduce:group-active:scale-100'

interface DetailActionsProps {
  /** Món của chính người dùng thì ẩn "To Custom" (không cần sao chép). */
  readonly canCopyToCustom: boolean
  readonly isCopyPending: boolean
  readonly onCopyToCustom: () => void
  readonly isFavorite: boolean
  readonly isFavoriteDisabled: boolean
  readonly onToggleFavorite: () => void
  /** Chỉ có khi sửa món đã log: thêm nút Remove (xoá khỏi nhật ký) đứng đầu, thứ tự Remove · Favorite · To Custom. */
  readonly onRemove?: () => void
}

/** Các nút nhỏ dưới hàng macro: To Custom (mở trang Create Food điền sẵn), Favorite (lưu theo khẩu phần + số lượng) và Remove khi sửa. */
export function DetailActions({
  canCopyToCustom,
  isCopyPending,
  onCopyToCustom,
  isFavorite,
  isFavoriteDisabled,
  onToggleFavorite,
  onRemove,
}: DetailActionsProps) {
  const custom = canCopyToCustom && (
    <button type="button" disabled={isCopyPending} onClick={onCopyToCustom} className={TILE}>
      <span className={TILE_ICON}>
        <Package aria-hidden="true" className="size-5" />
      </span>
      To Custom
    </button>
  )
  const favorite = (
    <button
      type="button"
      aria-pressed={isFavorite}
      disabled={isFavoriteDisabled}
      onClick={onToggleFavorite}
      className={TILE}
    >
      <span className={TILE_ICON}>
        <Heart
          aria-hidden="true"
          className={cn('size-5 transition-colors', isFavorite && 'fill-red-500 text-red-500')}
        />
      </span>
      Favorite
    </button>
  )
  return (
    <div className="flex gap-5">
      {onRemove && (
        <button type="button" onClick={onRemove} className={TILE}>
          <span className={TILE_ICON}>
            <CircleMinus aria-hidden="true" className="size-5" />
          </span>
          Remove
        </button>
      )}
      {onRemove ? (
        <>
          {favorite}
          {custom}
        </>
      ) : (
        <>
          {custom}
          {favorite}
        </>
      )}
    </div>
  )
}

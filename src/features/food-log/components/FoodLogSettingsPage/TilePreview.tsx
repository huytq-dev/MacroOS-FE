import { FoodTile, type FoodTileData, type FoodTileSettings } from '../FoodLogPage'

/** Hai món mẫu (đủ dài để thấy khác biệt giữa các mật độ) với giờ ăn 11:34 và 11:45. */
const SAMPLES: readonly { time: string; food: FoodTileData }[] = [
  {
    time: '11:34',
    food: {
      name: 'Delicious Soup',
      calories: 149,
      protein: 7,
      fat: 5,
      carbs: 20,
      servingText: '1 hearty bowl',
      weightText: '250 g',
      emoji: '🍲',
    },
  },
  {
    time: '11:45',
    food: {
      name: 'Tropical Fruit Salad With Pineapples, Bananas, Mangos, And Kiwis',
      calories: 60,
      protein: 0,
      fat: 0,
      carbs: 16,
      servingText: '1 cup',
      weightText: '140 g',
      emoji: '🥗',
    },
  },
]

/**
 * Khung xem trước. timeline: giờ ở bên trái nằm trên đường dọc mảnh (đường bị ngắt quanh chữ giờ như MacroFactor), ô là thẻ có
 * nền. logger: dòng phẳng ngăn bằng đường kẻ, không có giờ, như kết quả tìm kiếm. Ô theo đúng cài đặt đang chọn.
 */
export function TilePreview({
  settings,
  variant = 'timeline',
}: {
  readonly settings: FoodTileSettings
  readonly variant?: 'timeline' | 'logger'
}) {
  if (variant === 'logger')
    return (
      <section aria-label="Preview" className="space-y-3">
        <h2 className="text-xl font-bold">Preview</h2>
        <ol className="divide-foreground/10 divide-y">
          {SAMPLES.map(({ time, food }) => (
            <li key={time}>
              <FoodTile food={food} settings={settings} variant="row" />
            </li>
          ))}
        </ol>
      </section>
    )
  return (
    <section aria-label="Preview" className="space-y-3">
      <h2 className="text-xl font-bold">Preview</h2>
      <ol className="bg-background relative space-y-2 rounded-xl p-2">
        <span aria-hidden="true" className="bg-foreground/20 absolute inset-y-2 left-7 w-px" />
        {SAMPLES.map(({ time, food }) => (
          <li key={time} className="flex items-center gap-2">
            <span className="text-muted-foreground bg-background relative z-10 w-10 shrink-0 py-2 text-center text-xs tabular-nums">
              {time}
            </span>
            <div className="min-w-0 flex-1">
              <FoodTile food={food} settings={settings} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

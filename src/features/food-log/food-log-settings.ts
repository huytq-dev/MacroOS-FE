/** Cài đặt Food Log của người dùng, khớp BE `GET/PUT /api/food-logs/settings` (lưu trên server, đồng bộ nhiều thiết bị). */
export interface FoodLogSettings {
  /** Nutrient Reporting: NoOverages = không hiện số âm khi vượt mục tiêu (chặn ở 0), ShowOverages = hiện số âm. */
  overages: 'NoOverages' | 'ShowOverages'
  /** Khoảng giờ mặc định của timeline (0–23, last − first ≥ 1). */
  hourRangeFirst: number
  hourRangeLast: number
  alignment: 'Left' | 'Right'
  /** PlusIcon = nút + cạnh mỗi giờ; LongPress = nhấn giữ viên thuốc giờ để thêm món. */
  addFoodsToHour: 'PlusIcon' | 'LongPress'
  showTimestamps: boolean
  showHourlyTotals: boolean
  /** Show và ShowAndPin cùng nghĩa là luôn hiện (giữ cả hai vì BE đã lưu); Hide = ẩn thanh tuần. */
  weekBanner: 'Show' | 'ShowAndPin' | 'Hide'
  /** Daily = vuốt thanh tuần theo từng ngày; Weekly = mỗi lần vuốt nhảy cả tuần. */
  calendarScrolling: 'Daily' | 'Weekly'
  premoveEnabled: boolean
  /** Hai cờ này BE dùng để lọc kết quả `GET /foods`. */
  showBrandedResults: boolean
  showOpenFoodFactsResults: boolean
  optimization: 'Speed' | 'Accuracy'
  /** Timeline Food Tiles: mật độ ô món (Comfort rộng, Standard cân bằng, Compact chặt). */
  timelineTileDensity: 'Comfort' | 'Standard' | 'Compact'
  timelineShowMacros: boolean
  timelineShowWeight: boolean
  timelineShowServing: boolean
  /** Điểm nhấn bên phải ô món: Edit = nút sửa nhanh, Energy = hiện kcal, None = không có (tên món dài hơn). */
  timelineHighlight: 'Edit' | 'Energy' | 'None'
  /** Logger Banner (đầu bảng Thêm món): chất dinh dưỡng hiện trên banner. */
  loggerBannerShowCalories: boolean
  loggerBannerShowProtein: boolean
  loggerBannerShowFat: boolean
  loggerBannerShowCarbs: boolean
  /** PlateOnly = chỉ món trong plate; AllDayAndPlate = cả ngày + plate; RemainingAfterPlate = còn lại sau plate. */
  loggerBannerDisplay: 'PlateOnly' | 'AllDayAndPlate' | 'RemainingAfterPlate'
  /** Logger Food Tiles: cách ô món hiện trong kết quả tìm kiếm (cùng ý nghĩa với bộ Timeline). */
  loggerTileDensity: 'Comfort' | 'Standard' | 'Compact'
  loggerShowMacros: boolean
  loggerShowWeight: boolean
  loggerShowServing: boolean
  /** MultiAdd = nút + thêm món vào plate không rời tìm kiếm; Energy = hiện kcal; None = không có điểm nhấn. */
  loggerHighlight: 'MultiAdd' | 'Energy' | 'None'
}

/** Giá trị trước khi tải xong và khi người dùng chưa lưu lần nào; trùng mặc định của BE. */
export const DEFAULT_FOOD_LOG_SETTINGS: FoodLogSettings = {
  overages: 'NoOverages',
  hourRangeFirst: 7,
  hourRangeLast: 23,
  alignment: 'Left',
  addFoodsToHour: 'PlusIcon',
  showTimestamps: true,
  showHourlyTotals: true,
  weekBanner: 'Show',
  calendarScrolling: 'Daily',
  premoveEnabled: false,
  showBrandedResults: true,
  showOpenFoodFactsResults: true,
  optimization: 'Speed',
  timelineTileDensity: 'Standard',
  timelineShowMacros: true,
  timelineShowWeight: false,
  timelineShowServing: true,
  timelineHighlight: 'Edit',
  loggerBannerShowCalories: true,
  loggerBannerShowProtein: true,
  loggerBannerShowFat: true,
  loggerBannerShowCarbs: true,
  loggerBannerDisplay: 'PlateOnly',
  loggerTileDensity: 'Standard',
  loggerShowMacros: true,
  loggerShowWeight: false,
  loggerShowServing: true,
  loggerHighlight: 'None',
}

export interface SettingChoice<T extends string> {
  readonly value: T
  readonly label: string
  readonly description?: string
}

/** Phụ đề dưới tiêu đề bảng chọn của từng cài đặt (khớp MacroFactor). */
export const FOOD_LOG_SUBTITLE: Partial<Record<keyof typeof FOOD_LOG_CHOICES, string>> = {
  alignment: 'How your timeline will be aligned',
  addFoodsToHour: 'Add foods directly to hour from timeline',
  showTimestamps: 'Hour and minute next to each food',
  showHourlyTotals: 'Hourly macro totals on the timeline',
  weekBanner: 'Choose banner configuration',
  premoveEnabled: 'Move foods between hours quicker',
  showBrandedResults: 'Show branded items in search',
  showOpenFoodFactsResults: 'Show Open Food Facts items in search',
}

/** Các lựa chọn của từng cài đặt dạng chọn một (hiện trong bảng "Edit"); cờ bool dùng giá trị chuỗi 'true' / 'false'. */
export const FOOD_LOG_CHOICES = {
  overages: [
    {
      value: 'NoOverages',
      label: 'No Overages',
      description: 'No negative numbers will be used if you exceed a nutrient target',
    },
    {
      value: 'ShowOverages',
      label: 'Show Overages',
      description:
        'Negative numbers will be used in nutrient remaining views if you exceed your target',
    },
  ],
  alignment: [
    { value: 'Left', label: 'Left aligned' },
    { value: 'Right', label: 'Right aligned' },
  ],
  addFoodsToHour: [
    {
      value: 'PlusIcon',
      label: 'Plus icon next to each hour',
      description:
        'Each hour will have a persistent circular button next to it for adding foods to that hour',
    },
    {
      value: 'LongPress',
      label: 'Long-press hour shortcut',
      description: 'Long-pressing the hour itself will take you to adding foods for that hour',
    },
  ],
  showTimestamps: [
    { value: 'true', label: 'Show timestamps' },
    { value: 'false', label: 'Hide timestamps' },
  ],
  showHourlyTotals: [
    {
      value: 'true',
      label: 'Show',
      description:
        'Each hour will have a persistent summary of Calories and macros consumed for that hour',
    },
    {
      value: 'false',
      label: 'Hide',
      description:
        'Your foods will still display Calories and macros on the timeline, but you will no longer see hourly totals',
    },
  ],
  weekBanner: [
    { value: 'Show', label: 'Show' },
    { value: 'ShowAndPin', label: 'Show & Pin' },
    { value: 'Hide', label: 'Hide' },
  ],
  calendarScrolling: [
    {
      value: 'Daily',
      label: 'Daily Scroll',
      description: 'The calendar scrolls freely and settles one day at a time',
    },
    {
      value: 'Weekly',
      label: 'Weekly Swipe',
      description: 'Each swipe moves the calendar one full week',
    },
  ],
  premoveEnabled: [
    {
      value: 'true',
      label: 'On',
      description:
        'After selecting a food, the Move shortcut will appear next to the hour even if the Move action has not yet been selected',
    },
    {
      value: 'false',
      label: 'Off',
      description:
        'After selecting a food, you will need to select the Move action before the Move shortcut will appear',
    },
  ],
  showBrandedResults: [
    { value: 'true', label: 'On' },
    { value: 'false', label: 'Off' },
  ],
  showOpenFoodFactsResults: [
    { value: 'true', label: 'On' },
    { value: 'false', label: 'Off' },
  ],
  optimization: [
    { value: 'Speed', label: 'Optimize for speed' },
    { value: 'Accuracy', label: 'Optimize for accuracy' },
  ],
  timelineTileDensity: [
    {
      value: 'Comfort',
      label: 'Comfort',
      description: 'Comfortable tile density with generous spacing',
    },
    {
      value: 'Standard',
      label: 'Standard',
      description:
        'Standard tile density that balances displaying information with generous spacing',
    },
    {
      value: 'Compact',
      label: 'Compact',
      description: 'Tightly packed tiles maximize the number of tiles in view',
    },
  ],
  timelineHighlight: [
    {
      value: 'Edit',
      label: 'Edit',
      description: 'Edit shortcut lets you enter the editor for a single food with one tap',
    },
    {
      value: 'Energy',
      label: 'Energy',
      description: 'Energy highlight displays caloric content of the food',
    },
    {
      value: 'None',
      label: 'None',
      description: 'Removes the highlight in favor of longer food names',
    },
  ],
  loggerHighlight: [
    {
      value: 'MultiAdd',
      label: 'Multi-Add',
      description: 'Shows a + button that opens the food so you can add it to your plate',
    },
    {
      value: 'Energy',
      label: 'Energy',
      description: 'Energy highlight displays caloric content of the food',
    },
    {
      value: 'None',
      label: 'None',
      description: 'Removes the highlight in favor of longer food names',
    },
  ],
  loggerBannerDisplay: [
    { value: 'PlateOnly', label: 'Show Plate Nutrition Only' },
    { value: 'AllDayAndPlate', label: 'Show All Day & Plate Nutrition' },
    { value: 'RemainingAfterPlate', label: 'Show Remaining After Plate' },
  ],
} as const

/** "7 AM" / "11 PM" (nhãn trên thanh trượt Hour Range). */
export const hour12Label = (hour: number) =>
  `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`

export const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`

/** Cài đặt ô món dùng chung cho timeline và kết quả tìm kiếm (tên trung tính). */
export interface TileOptions {
  density: 'Comfort' | 'Standard' | 'Compact'
  showMacros: boolean
  showWeight: boolean
  showServing: boolean
  highlight: 'Edit' | 'MultiAdd' | 'Energy' | 'None'
}

export const timelineTileOptions = (settings: FoodLogSettings): TileOptions => ({
  density: settings.timelineTileDensity,
  showMacros: settings.timelineShowMacros,
  showWeight: settings.timelineShowWeight,
  showServing: settings.timelineShowServing,
  highlight: settings.timelineHighlight,
})

export const loggerTileOptions = (settings: FoodLogSettings): TileOptions => ({
  density: settings.loggerTileDensity,
  showMacros: settings.loggerShowMacros,
  showWeight: settings.loggerShowWeight,
  showServing: settings.loggerShowServing,
  highlight: settings.loggerHighlight,
})

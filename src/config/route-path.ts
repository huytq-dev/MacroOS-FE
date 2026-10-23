export const routePath = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  confirmEmail: '/confirm-email',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  dashboardInsights: '/dashboard/insights',
  dashboardExpenditure: '/dashboard/expenditure',
  dashboardWeightTrend: '/dashboard/weight-trend',
  dashboardEnergyBalance: '/dashboard/energy-balance',
  dashboardGoalProgress: '/dashboard/goal-progress',
  dashboardNutrition: '/dashboard/nutrition',
  /** Chi tiết Macros (cột chồng năng lượng mỗi ngày + phần trăm calo P / F / C): bấm ô Macros. */
  dashboardMacros: '/dashboard/macros',
  /** Chi tiết một nutrient (chart, mục tiêu, hôm nay, lịch sử): khoá theo `nutrient-catalog` (calories, protein, vitaminC…). */
  dashboardNutrient: (key: string) => `/dashboard/nutrition/${key}`,
  /** Tóm tắt một nutrient: Today / Past Week / Past Month, mục tiêu hiện hành, mọi món đóng góp, phân bố theo giờ. */
  dashboardNutrientSummary: (key: string) => `/dashboard/nutrition/${key}/summary`,
  /** "About Nutrient Goals": giải thích Floor / Target / Ceiling, màu theo nutrient đang xem. */
  dashboardNutrientGoals: (key: string) => `/dashboard/nutrition/${key}/goals`,
  dashboardCustomize: '/dashboard/customize',
  profile: '/profile',
  program: '/program',
  programNew: '/program/new',
  programCheckIn: '/program/check-in',
  shortcuts: '/shortcuts',
  progressPhotos: '/progress-photos',
  /** Màn xem ảnh; `?date=yyyy-MM-dd&angle=Front|Side|Back` mở đúng ngày / góc. */
  progressPhotosGallery: '/progress-photos/gallery',
  progressPhotosCompare: '/progress-photos/compare',
  programGoalEdit: '/program/goal/edit',
  weight: '/weight',
  /** Nutrition Data Manager: nhập / sửa dinh dưỡng từng ngày (kcal, macro, fasting, incomplete). */
  nutritionData: '/nutrition-data',
  visualBodyFat: '/body-fat',
  /** Trang một số đo vòng: khoá theo `features/weight/body-measurements.ts` (neck, leftBicep…). */
  bodyMeasurement: (key: string) => `/body-metrics/${key}`,
  /** Full Body: danh sách ngày có số đo; `/all` = All Metrics, `/compare` = Compare All Metrics. */
  fullBody: '/full-body',
  fullBodyAll: '/full-body/all',
  fullBodyCompare: '/full-body/compare',
  /** General: bước chân (chart + lịch sử, thêm / sửa / xoá từng ngày). */
  steps: '/steps',
  /** General: kỳ kinh (danh sách chu kỳ, thêm / sửa / xoá). */
  period: '/period',
  habitsWeighIn: '/habits/weigh-in',
  habitsFoodLogging: '/habits/food-logging',
  foodLog: '/food-log',
  foodLogSettings: '/food-log/settings',
  foodLogNutritionOverview: '/food-log/nutrition-overview',
  foodLogLoggerBanner: '/food-log/settings/logger-banner',
  foodLogLoggerTiles: '/food-log/settings/logger-tiles',
  foodLogTimelineTiles: '/food-log/settings/timeline-tiles',
  foods: '/foods',
  recipeNew: '/recipes/new',
  /** Trang Create Food; `?from=<foodId>` điền sẵn từ một món ("To Custom"). */
  foodNew: '/foods/new',
  more: '/more',
  /** More › Expenditure: Estimation Method, Calculation Start Date, BMR Equation, mode, algorithm, modifiers. */
  moreExpenditure: '/more/expenditure',
  /** More › Expenditure › BMR Equation: công thức BMR + các biến ảnh hưởng BMR. */
  moreBmr: '/more/expenditure/bmr',
  moreTutorials: '/more/tutorials',
} as const

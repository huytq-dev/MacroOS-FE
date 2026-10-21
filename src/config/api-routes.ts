// Khớp BE src/API/Controllers (prefix /api do axios baseURL cấp)
export const apiRoutes = {
  auth: {
    register: '/auth/register', // POST
    login: '/auth/login', // POST
    logout: '/auth/logout', // POST
    refresh: '/auth/refresh-token', // POST
    changePassword: '/auth/change-password', // POST
    forgotPassword: '/auth/forgot-password', // POST
    resetPassword: '/auth/reset-password', // POST
    confirmEmail: '/auth/confirm-email', // POST (công khai: token trong link email là bằng chứng)
    resendVerification: '/auth/resend-verification', // POST (công khai, 1 email/60 giây)
  },
  users: {
    me: '/users/me', // GET, PUT
  },
  programs: {
    setup: '/programs/setup', // GET → { weightKg, estimatedTdeeKcal, floors, kcalMax, proteinPerKgMax } cho wizard New Program
    preview: '/programs/preview', // POST body như create, không ghi DB
    root: '/programs', // POST
    current: '/programs/current', // GET, DELETE
    goal: '/programs/current/goal', // PUT
    style: '/programs/current/style', // PUT
    expenditure: '/programs/current/expenditure', // PUT
  },
  shortcuts: {
    root: '/shortcuts', // GET, PUT { toolbarStyle, items[] } → { toolbarStyle, items[12], isDefault }
    reset: '/shortcuts/reset', // POST → mặc định
  },
  bodyMetrics: {
    fullBody: '/body-metrics/full-body', // GET, PUT, DELETE ?date= → { date, visualBodyFatPercent, tape, hasData }
    fullBodyHistory: '/body-metrics/full-body/history', // GET ?from&to → { items: [{ date, metricCount, visualBodyFatPercent, tape, scaleWeightKg, trendWeightKg }] } mới nhất trước
    visualBodyFat: '/body-metrics/visual-body-fat', // GET ?from&to&granularity&all, POST { date?, percent }
    visualBodyFatByDate: (date: string) => `/body-metrics/visual-body-fat/${date}`, // DELETE
    measurementsOverview: '/body-metrics/measurements/overview', // GET ?entries=7 → { metrics: [{ key, group, latestDate, latestCm, entries: [{ date, valueCm }] }] } chỉ số đo đã có dữ liệu, entries mới nhất trước
    measurement: (key: string) => `/body-metrics/measurements/${key}`, // GET ?to&all, POST { date, valueCm }
    measurementByDate: (key: string, date: string) => `/body-metrics/measurements/${key}/${date}`, // DELETE
  },
  progressPhotos: {
    root: '/progress-photos', // GET ?date=, PUT multipart { file, angle, date?, consent }, DELETE ?date=&angle?
    sessions: '/progress-photos/sessions', // GET → { hasConsent, sessions[{ date, photos[], scaleWeightKg, trendWeightKg }] } mới nhất trước
  },
  checkIns: {
    session: '/check-ins/session', // GET → hub check-in: module + 7 ngày kcal + preview đề xuất
    incompleteDays: '/check-ins/incomplete-days', // PUT { dates[] } → session mới
    modules: '/check-ins/modules', // PUT { introSeen?, partialLoggingHidden? }
    accept: '/check-ins/accept', // POST
    reject: '/check-ins/reject', // POST
  },
  foodFavorites: {
    root: '/food-favorites', // GET, POST
    byId: (id: string) => `/food-favorites/${id}`, // DELETE
    order: '/food-favorites/order', // PUT { ids }
  },
  foods: {
    root: '/foods', // GET ?search&category&scope&top&skip, POST
    byId: (id: string) => `/foods/${id}`, // GET, PUT, DELETE
    nutrients: (id: string) => `/foods/${id}/nutrients`, // GET ?servingId&quantity&date → FoodNutrientsResponse (mọi chất + floor/target/ceiling của ngày)
    barcode: (code: string) => `/foods/barcode/${code}`, // GET → FoodDetail (8-14 chữ số; 404 không thấy, 502 Open Food Facts lỗi)
  },
  foodLogs: {
    root: '/food-logs', // GET ?date
    week: '/food-logs/week', // GET ?date (Thứ 2 → Chủ nhật của tuần chứa date)
    byDate: (date: string) => `/food-logs/${date}`, // DELETE (xoá cả ngày)
    settings: '/food-logs/settings', // GET (chưa lưu thì trả mặc định), PUT (cả object)
    notes: '/food-logs/notes', // POST { logDate?, text, notedAt? } → Guid
    note: (id: string) => `/food-logs/notes/${id}`, // PUT { text, notedAt? }, DELETE
    entries: '/food-logs/entries', // POST
    entry: (id: string) => `/food-logs/entries/${id}`, // PUT, DELETE
    bulkCopy: '/food-logs/entries/bulk-copy', // POST { ids[], toDate, toTime?, toMealType? } → số entry đã copy (toTime thiếu = giữ giờ gốc)
    bulkMove: '/food-logs/entries/bulk-move', // POST { ids[], toDate?, toTime?, toMealType? } (≥ 1 trường) → số entry đã chuyển
    bulkDelete: '/food-logs/entries/bulk-delete', // POST { ids[] } → số entry đã xoá
    quickAdd: '/food-logs/quick-add', // POST
    copy: '/food-logs/copy', // POST
    aiAnalyze: '/food-logs/ai/analyze', // POST multipart { photos[], description } → { dishes[{ id, name, ingredients[{ id, name, grams }] }] }
    aiConfirm: '/food-logs/ai/confirm', // POST { scanId, ingredients[{ name, foodItemId?, canonicalFoodId? }] } → { scanId, status: "Confirmed", remembered }; 404 scan lạ, 409 hết hạn
    plateNutrients: '/food-logs/plate/nutrients', // POST { date, items[{ foodItemId?|recipeId?, foodServingId?, quantity, name?, calories?… }] } → { date, plate[], day[] } NutrientAmountModel (không ghi DB); foodServingId null = quantity là gram
    aiResolveIngredient: '/food-logs/ai/resolve-ingredient', // POST { name, grams } → { matched, foodItemId, foodName, emoji, servingId?, quantity, unitLabel, weightGrams, calories, protein, fat, carbs, estimated? }
  },
  library: '/library', // GET ?scope=All|Foods|Recipes&search&top&skip → QueryResult<{ kind, id, name, brand, emoji, defaultServingId, servingName, calories, protein, carbs, fat (1 khẩu phần), updatedAt }>
  recipes: {
    root: '/recipes', // POST { name, servingsCount, ingredients[{ foodItemId, foodServingId, quantity }], cookedYieldGrams?, prepTimeMinutes?, cookTimeMinutes?, sourceUrl?, description?, steps?[{ text }], iconKey? } → Guid; GET/PUT/DELETE /recipes/{id}
    nutrients: '/recipes/nutrients', // POST { ingredients[], servingsCount?, date? } → { totalGrams, total, perServing, totalNutrients[], perServingNutrients[] } (chỉ đọc)
    createAndLog: '/recipes/create-and-log', // POST { recipe, log?: { logDate?, mealType?, eatenAt?, quantity? } } → { recipeId, entryId }
  },
  nutrition: {
    overview: '/nutrition/overview', // GET ?range=today|week|month|quarter|year&date= → { items[{ key, value, target }], contributors }
  },
  onboarding: {
    root: '/onboarding', // GET (trạng thái wizard)
    basics: '/onboarding/basics', // PUT
    estimate: '/onboarding/estimate', // GET (TDEE khởi điểm)
    preview: '/onboarding/preview', // POST (xem trước goal/program)
    complete: '/onboarding/complete', // POST
  },
  expenditure: {
    root: '/expenditure', // GET ?from&to
    changes: '/expenditure/changes', // GET → [{ days, deltaKcal, status }] cho 3/7/14/30/90 ngày
    daily: '/expenditure/daily', // GET ?from&to (mỗi ngày: đã ăn, target, cân xu hướng)
  },
  goals: {
    history: '/goals/history', // GET → [{ id, goalType, targetWeightKg, startWeightKg, ratePerWeekKg, startDate, endDate, status }]
    editPreview: '/goals/edit-preview', // POST { targetWeightKg?, weeklyRatePercent? } → mọi số màn Edit Goal, không ghi DB
    edit: '/goals/edit', // PUT { targetWeightKg, weeklyRatePercent } → { requiresNewProgram }, một lệnh atomic
    target: '/goals/target', // PUT { targetWeightKg } (null = xoá)
    progress: '/goals/progress', // GET → { goalType, startDate, startWeightKg, targetWeightKg, currentTrendKg, ... }
  },
  weights: {
    root: '/weights', // GET ?from&to, POST
    byDate: (logDate: string) => `/weights/${logDate}`, // DELETE
    trend: '/weights/trend', // GET ?from&to&all&granularity=Day|Week|Month → { days[{ date, trendKg, scaleKg, changeKg }], summary, scaleSummary, buckets }
    trendInsights: '/weights/trend/insights', // GET → { weightChanges[3,7,14,30,90], currentWeightKg, weeklyChangeKg, energyDeficitKcalPerDay, projected30DaysKg }
  },
} as const

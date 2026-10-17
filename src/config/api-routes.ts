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
    root: '/programs', // POST
    current: '/programs/current', // GET, DELETE
    goal: '/programs/current/goal', // PUT
    style: '/programs/current/style', // PUT
    expenditure: '/programs/current/expenditure', // PUT
  },
  foodFavorites: {
    root: '/food-favorites', // GET, POST
    byId: (id: string) => `/food-favorites/${id}`, // DELETE
    order: '/food-favorites/order', // PUT { ids }
  },
  foods: {
    root: '/foods', // GET ?search&category&scope&top&skip, POST
    byId: (id: string) => `/foods/${id}`, // GET, PUT, DELETE
    barcode: (code: string) => `/foods/barcode/${code}`, // GET → FoodDetail (8-14 chữ số; 404 không thấy, 502 Open Food Facts lỗi)
  },
  foodLogs: {
    root: '/food-logs', // GET ?date
    week: '/food-logs/week', // GET ?date (Thứ 2 → Chủ nhật của tuần chứa date)
    byDate: (date: string) => `/food-logs/${date}`, // DELETE (xoá cả ngày)
    settings: '/food-logs/settings', // GET (chưa lưu thì trả mặc định), PUT (cả object)
    status: (date: string) => `/food-logs/${date}/status`, // PUT { status } (Unmarked|Complete|Partial|Fasting)
    notes: '/food-logs/notes', // POST { logDate?, text, notedAt? } → Guid
    note: (id: string) => `/food-logs/notes/${id}`, // PUT { text, notedAt? }, DELETE
    entries: '/food-logs/entries', // POST
    entry: (id: string) => `/food-logs/entries/${id}`, // PUT, DELETE
    quickAdd: '/food-logs/quick-add', // POST
    copy: '/food-logs/copy', // POST
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
    progress: '/goals/progress', // GET → { goalType, startDate, startWeightKg, targetWeightKg, currentTrendKg, ... }
  },
  weights: {
    root: '/weights', // GET ?from&to, POST
    byDate: (logDate: string) => `/weights/${logDate}`, // DELETE
  },
} as const

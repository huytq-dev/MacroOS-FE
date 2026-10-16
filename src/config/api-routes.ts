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
  foods: {
    root: '/foods', // GET ?search&category&scope&top&skip, POST
    byId: (id: string) => `/foods/${id}`, // GET, PUT, DELETE
  },
  foodLogs: {
    root: '/food-logs', // GET ?date
    byDate: (date: string) => `/food-logs/${date}`, // DELETE (xoá cả ngày)
    entries: '/food-logs/entries', // POST
    entry: (id: string) => `/food-logs/entries/${id}`, // PUT, DELETE
    quickAdd: '/food-logs/quick-add', // POST
    copy: '/food-logs/copy', // POST
  },
  weights: {
    root: '/weights', // GET ?from&to, POST
    byDate: (logDate: string) => `/weights/${logDate}`, // DELETE
  },
} as const

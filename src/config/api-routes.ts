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
    confirmEmail: '/auth/confirm-email', // POST (cần đăng nhập)
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
  weights: {
    root: '/weights', // GET ?from&to, POST
    byDate: (logDate: string) => `/weights/${logDate}`, // DELETE
  },
} as const

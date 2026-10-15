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
  },
  users: {
    me: '/users/me', // GET, PUT
  },
} as const

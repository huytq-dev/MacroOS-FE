import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { Gender } from '@/config/enums'

// Khớp BE Application/Features/Auth/Login/LoginCommand.cs
export interface LoginRequest {
  email: string
  password: string
}

// Khớp BE Contract/Models/Auth/SignInResponse.cs (refreshToken đi qua HttpOnly cookie)
export interface LoginResponse {
  accessToken: string
  expiresIn: number
}

// Khớp BE RegisterCommand
export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  gender: Gender
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export const authService = {
  login: (credentials: LoginRequest) =>
    apiCall.post<LoginResponse>(apiRoutes.auth.login, credentials),
  logout: () => apiCall.post(apiRoutes.auth.logout),
  register: (payload: RegisterRequest) => apiCall.post<string>(apiRoutes.auth.register, payload),
  forgotPassword: (email: string) => apiCall.post(apiRoutes.auth.forgotPassword, { email }),
  resetPassword: (payload: ResetPasswordRequest) =>
    apiCall.post(apiRoutes.auth.resetPassword, payload),
  confirmEmail: (token: string) => apiCall.post(apiRoutes.auth.confirmEmail, { token }),
  resendVerification: (email: string) => apiCall.post(apiRoutes.auth.resendVerification, { email }),
}

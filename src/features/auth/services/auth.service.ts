import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'

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

export const authService = {
  login: (credentials: LoginRequest) => apiCall.post<LoginResponse>(apiRoutes.auth.login, credentials),
  logout: () => apiCall.post(apiRoutes.auth.logout),
}

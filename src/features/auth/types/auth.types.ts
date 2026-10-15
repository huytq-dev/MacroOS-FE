// Giải mã từ JWT của BE (JwtTokenService): sub, email, name, role, avatar
export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

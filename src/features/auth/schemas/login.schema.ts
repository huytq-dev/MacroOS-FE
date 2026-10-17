import { z } from 'zod'

// Khớp BE LoginCommandValidator: Email NotEmpty + EmailAddress, Password NotEmpty
export const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

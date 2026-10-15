// Matches BE Contract/Responses/ApiResponse.cs
export interface ApiResponse<T> {
  isSuccess: boolean
  statusCode: number
  message: string
  data: T | null
  errors?: Record<string, string[]>
}

// Matches BE Contract/Models/QueryResult.cs
export interface QueryResult<T> {
  items: T[]
  totalCount: number | null
}

// Matches BE Contract/Models/QueryInfo.cs
export interface QueryInfo {
  top: number
  skip: number
  needTotalCount?: boolean
  search?: string
}

// Error response from API
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

// API响应数据的通用类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 请求配置的扩展类型
export interface RequestConfig extends RequestInit {
  showLoading?: boolean
  showError?: boolean
  timeout?: number
}

// 错误信息类型
export interface ApiError {
  code: number
  message: string
  details?: any
}

// 分页请求参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应数据
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  user: User
}

// 注册请求参数
export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
} 
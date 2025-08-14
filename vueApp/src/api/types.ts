/**
 * API响应数据的通用类型
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  success?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * 请求配置的扩展类型
 */
export interface RequestConfig extends RequestInit {
  showLoading?: boolean
  showError?: boolean
  timeout?: number
}

/**
 * 错误信息类型
 */
export interface ApiError {
  code: number
  message: string
  details?: any
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 用户相关类型 - 匹配数据库结构
 */
export interface User {
  _id: string
  username: string
  email: string
  nickname?: string
  avatar?: string
  bio?: string
  level: number
  experience: number
  membership: {
    type?: string
    startDate?: string
    endDate?: string
    isActive: boolean
  }
  stats: {
    followers: number
    following: number
    videos: number
    likes: number
    views: number
  }
  status: 'active' | 'suspended' | 'banned'
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  __v: number
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string
  password: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string
  user: User
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
}

/**
 * 用户状态更新参数
 */
export interface UserStatusUpdateParams {
  status: 'active' | 'suspended' | 'banned'
}

/**
 * 权限相关类型
 */
export interface Permission {
  _id: string
  name: string
  description: string
  code: string
  type: string
  createdAt: string
  __v: number
}

/**
 * 权限添加请求参数
 */
export interface PermissionAddParams {
  name: string
  description: string
  code: string
  type: string
}

/**
 * 管理员信息
 */
export interface Manager {
  _id: string
  username: string
  realName?: string
  role?: string | Role
  password?: string
  permissions?: string[] | Permission[]
  createdAt: string
  updatedAt: string
  __v: number
}

/**
 * 管理员添加请求参数
 */
export interface ManagerAddParams {
  username: string
  password: string
  realName?: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status?: string
  role?: string
  permissions?: string[]
}

/**
 * 角色相关类型
 */
export interface Role {
  _id: string
  name: string
  description: string
  permissions: string[] | Permission[]
  createdAt: string
  updatedAt: string
  __v: number
}

/**
 * 角色添加请求参数
 */
export interface RoleAddParams {
  name: string
  description: string
  permissions?: string[]
}

/**
 * 角色删除请求参数
 */
export interface RoleDeleteParams {
  _id: string
}

/**
 * 角色修改请求参数
 */
export interface RoleUpdateParams {
  _id: string
  name: string
  description: string
  permissions?: string[]
}
import { http } from './request'
import type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  RegisterParams,
  User,
  PaginationParams,
  PaginationResponse,
  Permission,
  PermissionAddParams,
  Role,
  RoleAddParams,
  RoleDeleteParams,
  RoleUpdateParams,
  Manager,
  ManagerAddParams
} from './types'

/**
 * 用户认证相关API
 */
export const authApi = {
  /**
   * 用户登录
   * @param params - 登录参数
   * @returns 登录响应，包含token和用户信息
   */
  login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
    return http.post<LoginResponse>('/managers/login', params)
  },

  /**
   * 用户注册
   * @param params - 注册参数
   * @returns 注册的用户信息
   */
  register(params: RegisterParams): Promise<ApiResponse<User>> {
    return http.post<User>('/auth/register', params)
  },

  /**
   * 用户登出
   * @returns 登出响应
   */
  logout(): Promise<ApiResponse<null>> {
    return http.post<null>('/auth/logout')
  },

  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  getCurrentUser(): Promise<ApiResponse<User>> {
    return http.get<User>('/auth/me')
  },

  /**
   * 刷新token
   * @returns 新的token
   */
  refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return http.post<{ token: string }>('/auth/refresh')
  }
}

/**
 * 用户管理相关API
 */
export const userApi = {
  /**
   * 获取用户列表（分页）
   * @param params - 分页参数和关键字
   * @returns 用户列表和分页信息
   */
  getUsers(params: PaginationParams & { keyword?: string }): Promise<ApiResponse<PaginationResponse<User>>> {
    return http.get<PaginationResponse<User>>('/users/list', { params })
  },

  /**
   * 获取单个用户信息
   * @param id - 用户ID
   * @returns 用户信息
   */
  getUser(id: string): Promise<ApiResponse<User>> {
    return http.get<User>(`/users/detail/${id}`)
  },

  /**
   * 创建用户
   * @param userData - 用户数据
   * @returns 创建的用户信息
   */
  createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return http.post<User>('/users', userData)
  },

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param userData - 用户数据
   * @returns 更新后的用户信息
   */
  updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return http.post<User>(`/users/${id}`, userData)
  },

  /**
   * 删除用户
   * @param id - 用户ID
   * @returns 删除响应
   */
  deleteUser(id: string): Promise<ApiResponse<null>> {
    return http.delete<null>(`/users/${id}`)
  },

  /**
   * 更新用户状态
   * @param id - 用户ID
   * @param status - 用户状态
   * @returns 更新后的用户信息
   */
  updateUserStatus(id: string, status: 'active' | 'suspended' | 'banned'): Promise<ApiResponse<User>> {
    return http.put<User>(`/users/${id}/status`, { status })
  },

  /**
   * 批量删除用户
   * @param ids - 用户ID数组
   * @returns 删除响应
   */
  batchDeleteUsers(ids: string[]): Promise<ApiResponse<null>> {
    return http.post<null>('/users/batch-delete', { ids })
  },

  /**
   * 搜索用户
   * @param keyword - 搜索关键字
   * @param params - 分页参数
   * @returns 用户列表和分页信息
   */
  searchUsers(keyword: string, params?: PaginationParams): Promise<ApiResponse<PaginationResponse<User>>> {
    return http.get<PaginationResponse<User>>('/users/list', { 
      params: { keyword, ...params } 
    })
  }
}

/**
 * 角色相关API
 */
export const roleApi = {
  /**
   * 获取角色列表（分页）
   * @param params - 分页参数
   * @returns 角色列表
   */
  getRoles(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<Role[]>> {
    return http.get<Role[]>('/roles/list', { params })
  },
  
  /**
   * 获取所有角色（不分页）
   * @returns 所有角色列表
   */
  getAllRoles(): Promise<ApiResponse<Role[]>> {
    return http.get<Role[]>('/roles/list', { params: { page: 1, pageSize: 1000 } })
  },
  
  /**
   * 获取角色详情（包含权限）
   * @param id - 角色ID
   * @returns 角色详细信息
   */
  getRoleDetail(id: string): Promise<ApiResponse<Role>> {
    return http.get<Role>(`/roles/detail/${id}`)
  },
  
  /**
   * 添加角色
   * @param params - 角色参数
   * @returns 创建的角色信息
   */
  addRole(params: RoleAddParams): Promise<ApiResponse<Role>> {
    return http.post<Role>('/roles/create', params)
  },
  
  /**
   * 修改角色
   * @param params - 角色更新参数
   * @returns 更新后的角色信息
   */
  updateRole(params: { _id: string; name?: string; description?: string; permissions?: string[] }): Promise<ApiResponse<Role>> {
    return http.post<Role>('/roles/edit', params)
  },
  
  /**
   * 删除角色
   * @param params - 角色删除参数
   * @returns 删除响应
   */
  deleteRole(params: { _id: string }): Promise<ApiResponse<null>> {
    return http.post<null>('/roles/delete', params)
  }
}

/**
 * 权限管理相关API
 */
export const permissionApi = {
  /**
   * 获取权限列表
   * @param params - 分页参数
   * @returns 权限列表
   */
  getPermissions(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<Permission[]>> {
    return http.get<Permission[]>('/permissions/list', { params })
  },
  
  /**
   * 获取所有权限（不分页）
   * @returns 所有权限列表
   */
  getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return http.get<Permission[]>('/permissions/list', { params: { page: 1, pageSize: 1000 } })
  },
  
  /**
   * 添加权限
   * @param params - 权限参数
   * @returns 创建的权限信息
   */
  addPermission(params: PermissionAddParams): Promise<ApiResponse<Permission>> {
    return http.post<Permission>('/permissions/add', params)
  },
  
  /**
   * 修改权限
   * @param params - 权限更新参数
   * @returns 更新后的权限信息
   */
  updatePermission(params: { _id: string; name?: string; description?: string; code?: string; type?: string }): Promise<ApiResponse<Permission>> {
    return http.post<Permission>('/permissions/update', params)
  },
  
  /**
   * 删除权限
   * @param params - 权限删除参数
   * @returns 删除响应
   */
  deletePermission(params: { _id: string }): Promise<ApiResponse<null>> {
    return http.post<null>('/permissions/delete', params)
  }
}

/**
 * 管理员管理相关API
 */
export const managerApi = {
  /**
   * 获取管理员列表
   * @param params - 分页参数
   * @returns 管理员列表
   */
  getManagers(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<Manager[]>> {
    return http.get<Manager[]>('/managers/list', { params })
  },
  
  /**
   * 添加管理员
   * @param params - 管理员参数
   * @returns 创建的管理员信息
   */
  addManager(params: ManagerAddParams): Promise<ApiResponse<Manager>> {
    return http.post<Manager>('/managers/add', params)
  },
  
  /**
   * 修改管理员
   * @param params - 管理员更新参数
   * @returns 更新后的管理员信息
   */
  updateManager(params: { _id: string; username?: string; password?: string; role?: string; permissions?: string[] }): Promise<ApiResponse<Manager>> {
    return http.post<Manager>('/managers/update', params)
  },
  
  /**
   * 删除管理员
   * @param params - 管理员删除参数
   * @returns 删除响应
   */
  deleteManager(params: { _id: string }): Promise<ApiResponse<null>> {
    return http.post<null>('/managers/delete', params)
  }
}

// 导出所有API
export default {
  auth: authApi,
  user: userApi,
  permissionApi
}
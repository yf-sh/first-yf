import { http } from './request'
import type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  RegisterParams,
  User,
  PaginationParams,
  PaginationResponse
} from './types'

// 用户认证相关API
export const authApi = {
  // 用户登录
  login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
    return http.post<LoginResponse>('/auth/login', params)
  },

  // 用户注册
  register(params: RegisterParams): Promise<ApiResponse<User>> {
    return http.post<User>('/auth/register', params)
  },

  // 用户登出
  logout(): Promise<ApiResponse<null>> {
    return http.post<null>('/auth/logout')
  },

  // 获取当前用户信息
  getCurrentUser(): Promise<ApiResponse<User>> {
    return http.get<User>('/auth/me')
  },

  // 刷新token
  refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return http.post<{ token: string }>('/auth/refresh')
  }
}

// 用户管理相关API
export const userApi = {
  // 获取用户列表（分页）
  getUsers(params: PaginationParams): Promise<ApiResponse<PaginationResponse<User>>> {
    return http.get<PaginationResponse<User>>('/users', { params })
  },

  // 获取单个用户信息
  getUser(id: number): Promise<ApiResponse<User>> {
    return http.get<User>(`/users/${id}`)
  },

  // 创建用户
  createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return http.post<User>('/users', userData)
  },

  // 更新用户信息
  updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return http.put<User>(`/users/${id}`, userData)
  },

  // 删除用户
  deleteUser(id: number): Promise<ApiResponse<null>> {
    return http.delete<null>(`/users/${id}`)
  },

  // 批量删除用户
  batchDeleteUsers(ids: number[]): Promise<ApiResponse<null>> {
    return http.post<null>('/users/batch-delete', { ids })
  },

  // 搜索用户
  searchUsers(keyword: string, params?: PaginationParams): Promise<ApiResponse<PaginationResponse<User>>> {
    return http.get<PaginationResponse<User>>('/users/search', { 
      params: { keyword, ...params } 
    })
  }
}

// 文件上传相关API
export const uploadApi = {
  // 上传单个文件
  uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)

    return http.post<{ url: string }>('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },

  // 上传多个文件
  uploadFiles(files: File[], onProgress?: (progress: number) => void): Promise<ApiResponse<{ urls: string[] }>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    return http.post<{ urls: string[] }>('/upload/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  }
}

// 系统相关API
export const systemApi = {
  // 获取系统信息
  getSystemInfo(): Promise<ApiResponse<any>> {
    return http.get('/system/info')
  },

  // 获取系统配置
  getSystemConfig(): Promise<ApiResponse<any>> {
    return http.get('/system/config')
  },

  // 更新系统配置
  updateSystemConfig(config: any): Promise<ApiResponse<any>> {
    return http.put('/system/config', config)
  }
}

// 导出所有API
export default {
  auth: authApi,
  user: userApi,
  upload: uploadApi,
  system: systemApi
} 
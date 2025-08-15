import { request } from './api';

// 用户相关接口类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
// 接口返回类型
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}
// 接口错误类型
export interface ApiError {
  code: number;
  msg: string;
  details?: any;
}

// 请求配置类型
export interface RequestConfig {
  showLoading?: boolean
  showError?: boolean
  timeout?: number
}


export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
// 更新用户请求类型
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}
// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user: User;
}

// 用户服务类
export class UserService {
  // 获取用户信息
  static async getUserInfo(userId: string): Promise<User> {
    try {
      const response = await request.get<User>(`/users/info?_id=${userId}`);
      console.log('API响应:', response);
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  // 获取用户列表
  static async getUserList(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const response = await request.get<{ users: User[]; total: number }>('/users', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 创建用户
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await request.post<User>('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 更新用户信息
  static async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await request.post<User>(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<void> {
    try {
      await request.post(`/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 用户登录
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await request.post<LoginResponse>('/users/login', loginData);
      // 保存token和登录时间到localStorage
      const loginTime = Date.now();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('loginTime', loginTime.toString());
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 带重试机制的用户信息获取
  static async getUserInfoWithRetry(userId: string): Promise<User> {
    try {
      const response = await request.get<User>(`/users/${userId}`, {
        retry: 3,
        retryDelay: 2000,
      });
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败（已重试3次）:', error);
      throw error;
    }
  }
}

// 导出默认实例（保持向后兼容）
export default UserService; 
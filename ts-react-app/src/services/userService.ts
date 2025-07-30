import { request } from '../api';

// 用户相关接口类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
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
      const response = await request.get<User>(`/users/${userId}`);
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
      const response = await request.post<User>('/users', userData);
      return response.data;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 更新用户信息
  static async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await request.put<User>(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<void> {
    try {
      await request.delete(`/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 用户登录
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await request.post<LoginResponse>('/auth/login', loginData);
      // 保存token到localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      await request.post('/auth/logout');
      // 清除token
      localStorage.removeItem('token');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使请求失败也要清除本地token
      localStorage.removeItem('token');
      throw error;
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await request.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
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

// 导出默认实例
export default UserService; 
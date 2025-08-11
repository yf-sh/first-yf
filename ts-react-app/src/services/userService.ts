import { request } from '../api';
import tokenManager from '../utils/tokenManager';

// 用户相关接口类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: number;
  experience?: number;
  createdAt: string;
  updatedAt: string;
}

// 等级配置类型
export interface LevelConfig {
  level: number;
  name: string;
  exp: number;
  benefits: string[];
}

// 等级信息类型
export interface LevelInfo {
  currentLevel: number;
  experience: number;
  currentLevelConfig: LevelConfig;
  nextLevelConfig?: LevelConfig;
  expToNext: number;
  progress: number;
}

// 增加经验值请求类型
export interface AddExperienceRequest {
  amount: number;
  reason?: string;
}

// 增加经验值响应类型
export interface AddExperienceResponse {
  oldExperience: number;
  newExperience: number;
  oldLevel: number;
  newLevel: number;
  levelUp: boolean;
  reason: string;
}

// 关注统计信息类型
export interface FollowStats {
  followers: number;
  following: number;
  videos: number;
  likes: number;
  views: number;
}

// 关注响应类型
export interface FollowResponse {
  followerId: string;
  followingId: string;
  followerStats: {
    following: number;
  };
  followingStats: {
    followers: number;
  };
}

// 用户统计信息类型
export interface UserStatsResponse {
  userId: string;
  username: string;
  nickname: string;
  stats: FollowStats;
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
  accessToken: string;
  refreshToken: string;
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
      
      // 使用TokenManager保存双token
      const { accessToken, refreshToken } = response.data;
      tokenManager.setTokens(accessToken, refreshToken);
      
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
      // 使用TokenManager清除tokens
      tokenManager.clearTokens();
    } catch (error) {
      console.error('登出失败:', error);
      // 即使请求失败也要清除本地tokens
      tokenManager.clearTokens();
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

  // 获取等级配置
  static async getLevelConfig(): Promise<LevelConfig[]> {
    try {
      const response = await request.get<LevelConfig[]>('/users/level-config');
      return response.data;
    } catch (error) {
      console.error('获取等级配置失败:', error);
      throw error;
    }
  }

  // 获取用户等级详情
  static async getLevelInfo(): Promise<LevelInfo> {
    try {
      const response = await request.get<LevelInfo>('/users/level-info');
      return response.data;
    } catch (error) {
      console.error('获取等级信息失败:', error);
      throw error;
    }
  }

  // 增加经验值
  static async addExperience(data: AddExperienceRequest): Promise<AddExperienceResponse> {
    try {
      const response = await request.post<AddExperienceResponse>('/users/add-experience', data);
      return response.data;
    } catch (error) {
      console.error('增加经验值失败:', error);
      throw error;
    }
  }

  // 关注用户
  static async followUser(userId: string): Promise<FollowResponse> {
    try {
      const response = await request.post<FollowResponse>(`/users/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error('关注用户失败:', error);
      throw error;
    }
  }

  // 取消关注用户
  static async unfollowUser(userId: string): Promise<FollowResponse> {
    try {
      console.log('发送取消关注请求:', userId);
      console.log('请求URL:', `/users/follow/${userId}`);
      const response = await request.delete<FollowResponse>(`/users/follow/${userId}`);
      console.log('取消关注成功:', response);
      return response.data;
    } catch (error) {
      console.error('取消关注用户失败:', error);
      throw error;
    }
  }

  // 获取用户统计信息
  static async getUserStats(userId?: string): Promise<UserStatsResponse> {
    try {
      const url = userId ? `/users/follow-stats/${userId}` : '/users/follow-stats';
      const response = await request.get<UserStatsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('获取用户统计信息失败:', error);
      throw error;
    }
  }
}

// 导出默认实例
export default UserService; 
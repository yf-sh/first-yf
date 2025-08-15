import request from './api';

// 关注用户数据接口
export interface FollowedUser {
  id: string;
  userId: string;
  username: string;
  name: string;
  desc: string;
  avatar: string;
  followers: number;
  following: number;
  videos: number;
  level: number;
  followedAt: string;
  memberSince: string;
}

// 关注列表响应接口
export interface FollowListResponse {
  total: number;
  following: FollowedUser[];
}

// 粉丝列表响应接口
export interface FollowerListResponse {
  total: number;
  followers: FollowedUser[];
}

// 关注操作响应接口
export interface FollowActionResponse {
  followerId: string;
  followingId: string;
  followerStats: {
    following: number;
  };
  followingStats: {
    followers: number;
  };
}

class FollowService {
  // 获取用户关注列表
  static async getFollowingList(userId?: string): Promise<FollowListResponse> {
    try {
      const url = userId ? `/users/following/${userId}` : '/users/following';
      const response = await request.get<FollowListResponse>(url);
      return response.data;
    } catch (error: any) {
      console.error('获取关注列表失败:', error);
      throw error;
    }
  }

  // 获取用户粉丝列表
  static async getFollowersList(userId?: string): Promise<FollowerListResponse> {
    try {
      const url = userId ? `/users/followers/${userId}` : '/users/followers';
      const response = await request.get<FollowerListResponse>(url);
      return response.data;
    } catch (error: any) {
      console.error('获取粉丝列表失败:', error);
      throw error;
    }
  }

  // 关注用户
  static async followUser(userId: string): Promise<FollowActionResponse> {
    try {
      const response = await request.post<FollowActionResponse>(`/users/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('关注用户失败:', error);
      throw error;
    }
  }

  // 取消关注用户
  static async unfollowUser(userId: string): Promise<FollowActionResponse> {
    try {
      const response = await request.delete<FollowActionResponse>(`/users/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('取消关注失败:', error);
      throw error;
    }
  }

  // 检查是否已关注某用户（通过获取关注列表判断）
  static async isFollowing(userId: string): Promise<boolean> {
    try {
      const followingList = await this.getFollowingList();
      return followingList.following.some(user => user.userId === userId);
    } catch (error: any) {
      console.error('检查关注状态失败:', error);
      return false;
    }
  }
}

export default FollowService;
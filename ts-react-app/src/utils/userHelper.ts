/**
 * 用户相关工具函数
 */

// 获取当前登录用户的ID
export const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user._id || null;
    }
    return null;
  } catch (error) {
    console.error('获取当前用户ID失败:', error);
    return null;
  }
};

// 获取当前登录用户的完整信息
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('获取当前用户信息失败:', error);
    return null;
  }
};

// 按用户隔离的localStorage键名生成器
export const getUserSpecificKey = (baseKey: string, userId?: string): string => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) {
    // 如果没有用户ID，使用全局键（为了向后兼容）
    return baseKey;
  }
  return `${baseKey}_${currentUserId}`;
};

// 获取用户特定的关注列表
export const getUserFollowedUps = (userId?: string): number[] => {
  try {
    const key = getUserSpecificKey('followedUps', userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取用户关注列表失败:', error);
    return [];
  }
};

// 设置用户特定的关注列表
export const setUserFollowedUps = (followedUps: number[], userId?: string): void => {
  try {
    const key = getUserSpecificKey('followedUps', userId);
    localStorage.setItem(key, JSON.stringify(followedUps));
  } catch (error) {
    console.error('设置用户关注列表失败:', error);
  }
};

// 获取用户特定的最近访问列表
export const getUserRecentVisited = (userId?: string): any[] => {
  try {
    const key = getUserSpecificKey('recentVisited', userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取用户访问记录失败:', error);
    return [];
  }
};

// 设置用户特定的最近访问列表
export const setUserRecentVisited = (recentVisited: any[], userId?: string): void => {
  try {
    const key = getUserSpecificKey('recentVisited', userId);
    localStorage.setItem(key, JSON.stringify(recentVisited));
  } catch (error) {
    console.error('设置用户访问记录失败:', error);
  }
};

// 清理用户数据（用户登出时调用）
export const clearUserData = (userId?: string): void => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (currentUserId) {
      const keysToRemove = [
        getUserSpecificKey('followedUps', currentUserId),
        getUserSpecificKey('recentVisited', currentUserId)
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error('清理用户数据失败:', error);
  }
};

// 迁移旧数据到新的用户特定格式（一次性迁移）
export const migrateUserData = (): void => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // 迁移关注列表
    const oldFollowedUps = localStorage.getItem('followedUps');
    if (oldFollowedUps && !localStorage.getItem(getUserSpecificKey('followedUps', currentUserId))) {
      localStorage.setItem(getUserSpecificKey('followedUps', currentUserId), oldFollowedUps);
      localStorage.removeItem('followedUps'); // 清理旧数据
    }

    // 迁移访问记录
    const oldRecentVisited = localStorage.getItem('recentVisited');
    if (oldRecentVisited && !localStorage.getItem(getUserSpecificKey('recentVisited', currentUserId))) {
      localStorage.setItem(getUserSpecificKey('recentVisited', currentUserId), oldRecentVisited);
      localStorage.removeItem('recentVisited'); // 清理旧数据
    }

    console.log('用户数据迁移完成');
  } catch (error) {
    console.error('用户数据迁移失败:', error);
  }
};
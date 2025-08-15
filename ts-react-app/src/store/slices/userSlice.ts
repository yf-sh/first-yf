/**
 * 用户状态管理 Redux Slice
 * 
 * 功能说明：
 * - 管理用户基本信息和统计数据
 * - 处理关注/粉丝数量的实时更新
 * - 提供用户登录状态管理
 * 
 * 使用场景：
 * - 个人中心页面显示用户信息和统计
 * - 关注功能中的数量实时更新
 * - 全局用户状态共享
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * 用户基本信息接口
 * 对应后端User模型的核心字段
 */
interface User {
  _id: string;          // 用户唯一标识
  username: string;     // 用户名
  email?: string;       // 邮箱（可选）
  role?: string;        // 用户角色（可选）
  createdAt?: string;   // 创建时间（可选）
  updatedAt?: string;   // 更新时间（可选）
}

/**
 * 用户统计数据接口
 * 包含用户在平台上的各项统计指标
 */
interface UserStats {
  followers: number;    // 粉丝数量
  following: number;    // 关注数量
  videos: number;       // 视频数量
  likes: number;        // 获赞数量
  views: number;        // 观看数量
}

/**
 * 用户状态管理接口
 * 定义Redux store中用户相关的所有状态
 */
interface UserState {
  users: User[];               // 用户列表（用于用户管理场景）
  currentUser: User | null;    // 当前登录用户信息
  userStats: UserStats | null; // 当前用户统计数据
  loading: boolean;            // 加载状态标识
  error: string | null;        // 错误信息
}

/**
 * Redux状态初始值
 * 应用启动时的默认状态
 */
const initialState: UserState = {
  users: [],
  currentUser: null,
  userStats: null,
  loading: false,
  error: null,
};

/**
 * 用户状态管理 Redux Slice
 * 
 * 使用Redux Toolkit的createSlice创建，包含：
 * - 状态定义
 * - 同步action reducers
 * - 自动生成的action creators
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * 设置用户统计数据
     * 
     * @param state - 当前状态
     * @param action - 包含完整UserStats对象的action
     * 
     * 使用场景：
     * - 用户登录后初始化统计数据
     * - 从服务器获取最新统计数据后更新
     * - 页面刷新时恢复统计数据
     */
    setUserStats: (state, action: { payload: UserStats }) => {
      state.userStats = action.payload;
    },

    /**
     * 更新关注数量
     * 
     * @param state - 当前状态
     * @param action - 包含增减数量的action（可为正数或负数）
     * 
     * 使用场景：
     * - 用户关注他人时 +1
     * - 用户取消关注时 -1
     * - 批量关注操作时传入对应数量
     * 
     * 注意：会检查userStats是否存在，避免空指针错误
     */
    updateFollowingCount: (state, action: { payload: number }) => {
      if (state.userStats) {
        state.userStats.following += action.payload;
        // 确保数量不会变成负数
        state.userStats.following = Math.max(0, state.userStats.following);
      }
    },

    /**
     * 更新粉丝数量
     * 
     * @param state - 当前状态
     * @param action - 包含增减数量的action（可为正数或负数）
     * 
     * 使用场景：
     * - 有用户关注当前用户时 +1
     * - 有用户取消关注当前用户时 -1
     * - 实时推送粉丝数变化
     * 
     * 注意：会检查userStats是否存在，避免空指针错误
     */
    updateFollowersCount: (state, action: { payload: number }) => {
      if (state.userStats) {
        state.userStats.followers += action.payload;
        // 确保数量不会变成负数
        state.userStats.followers = Math.max(0, state.userStats.followers);
      }
    },

    /**
     * 设置当前登录用户
     * 
     * @param state - 当前状态
     * @param action - 包含User对象的action
     * 
     * 使用场景：
     * - 用户登录成功后设置用户信息
     * - 用户信息更新后同步到Redux
     * - 页面刷新时从localStorage恢复用户信息
     */
    setCurrentUser: (state, action: { payload: User }) => {
      state.currentUser = action.payload;
    },

    /**
     * 清除用户数据
     * 
     * 使用场景：
     * - 用户退出登录
     * - 用户会话过期
     * - 切换用户账号
     * 
     * 注意：会同时清除用户信息和统计数据，确保数据一致性
     */
    clearUser: (state) => {
      state.currentUser = null;
      state.userStats = null;
      state.error = null; // 同时清除错误信息
    }
  },
});

/**
 * 导出action creators
 * 这些函数会自动由Redux Toolkit生成，可以直接在组件中dispatch使用
 * 
 * 使用示例：
 * ```typescript
 * // 在组件中使用
 * const dispatch = useDispatch();
 * 
 * // 设置用户统计
 * dispatch(setUserStats({ followers: 100, following: 50, videos: 10, likes: 200, views: 1000 }));
 * 
 * // 更新关注数量
 * dispatch(updateFollowingCount(1)); // 关注时 +1
 * dispatch(updateFollowingCount(-1)); // 取消关注时 -1
 * 
 * // 设置当前用户
 * dispatch(setCurrentUser({ _id: '123', username: 'john_doe' }));
 * 
 * // 清除用户数据
 * dispatch(clearUser());
 * ```
 */
export const { 
  setUserStats, 
  updateFollowingCount, 
  updateFollowersCount, 
  setCurrentUser, 
  clearUser 
} = userSlice.actions;

/**
 * 导出reducer
 * 用于在store配置中注册该slice
 * 
 * 使用示例：
 * ```typescript
 * // 在store/index.ts中使用
 * import userReducer from './slices/userSlice';
 * 
 * export const store = configureStore({
 *   reducer: {
 *     user: userReducer,
 *     // 其他reducers...
 *   },
 * });
 * ```
 */
export default userSlice.reducer; 
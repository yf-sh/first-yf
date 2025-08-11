import { createSlice } from '@reduxjs/toolkit';

// 定义接口
interface User {
  _id: string;
  username: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserStats {
  followers: number;
  following: number;
  videos: number;
  likes: number;
  views: number;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: UserState = {
  users: [],
  currentUser: null,
  userStats: null,
  loading: false,
  error: null,
};

// 创建 slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserStats: (state, action: { payload: UserStats }) => {
      state.userStats = action.payload;
    },
    updateFollowingCount: (state, action: { payload: number }) => {
      if (state.userStats) {
        state.userStats.following += action.payload;
      }
    },
    updateFollowersCount: (state, action: { payload: number }) => {
      if (state.userStats) {
        state.userStats.followers += action.payload;
      }
    },
    setCurrentUser: (state, action: { payload: User }) => {
      state.currentUser = action.payload;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.userStats = null;
    }
  },
});

export const { 
  setUserStats, 
  updateFollowingCount, 
  updateFollowersCount, 
  setCurrentUser, 
  clearUser 
} = userSlice.actions;
export default userSlice.reducer; 
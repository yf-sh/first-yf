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

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};



// 创建 slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
   
  },
  
});

export const { } = userSlice.actions;
export default userSlice.reducer; 
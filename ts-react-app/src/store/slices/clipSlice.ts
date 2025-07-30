import { createSlice } from '@reduxjs/toolkit';

// 定义接口
interface Clip {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  views?: number;
  likes?: number;
  userId: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

interface ClipState {
  clips: Clip[];
  currentClip: Clip | null;
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

// 初始状态
const initialState: ClipState = {
  clips: [],
  currentClip: null,
  loading: false,
  error: null,
  uploadProgress: 0,
};


// 创建 slice
const clipSlice = createSlice({
  name: 'clip',
  initialState,
  reducers: {},
});

export const { } = clipSlice.actions;
export default clipSlice.reducer; 
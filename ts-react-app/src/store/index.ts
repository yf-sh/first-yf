import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// 导入 slices

import userSlice from './slices/userSlice';
import clipSlice from './slices/clipSlice';

export const store = configureStore({
  reducer: {
    
    user: userSlice,
    clip: clipSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些 action 类型的序列化检查
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 
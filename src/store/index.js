import { configureStore } from '@reduxjs/toolkit';
import liveClassReducer from './slices/liveClassSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    liveClasses: liveClassReducer,
  },
});

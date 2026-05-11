import { configureStore } from '@reduxjs/toolkit';
import liveClassReducer from './slices/liveClassSlice';

export const store = configureStore({
  reducer: {
    liveClasses: liveClassReducer,
  },
});

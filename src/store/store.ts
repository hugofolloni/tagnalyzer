import { configureStore } from '@reduxjs/toolkit';
import tagReducer from './tagSlice';
import artistReducer from './artistSlice'
import imageReducer from './imageSlice'

export const store = configureStore({
  reducer: {
    tags: tagReducer,
    artists: artistReducer,
    images: imageReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
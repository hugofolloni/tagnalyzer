import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Album } from "../models/tag"

export interface TagState {
  tags: {
    name: string;
    count: number;
    artists: string[];
    albums: Album[];
  }[];
}

const initialState: TagState = {
  tags: [],
};

const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setTags(state, action: PayloadAction<TagState['tags']>) {
      state.tags = action.payload;
    },
  },
});

export const { setTags } = tagSlice.actions;
export default tagSlice.reducer;
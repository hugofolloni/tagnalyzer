import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TagState {
  tags: {
    name: string;
    count: number;
    artists: string[];
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
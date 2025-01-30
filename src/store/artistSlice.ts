import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Artist } from "../models/tag"

export interface TagState {
  artists: Artist[];

}

const initialState: TagState = {
  artists: [],
};

const tagSlice = createSlice({
  name: 'artists',
  initialState,
  reducers: {
    setArtists(state, action: PayloadAction<TagState['artists']>) {
      state.artists = action.payload;
    },
  },
});

export const { setArtists } = tagSlice.actions;
export default tagSlice.reducer;
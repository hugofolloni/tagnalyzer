import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ArtistInfoResponse } from "../models/tag"

export interface TagState {
  images: ArtistInfoResponse;

}

const initialState: TagState = {
  images: {tag: null, artist: null},
};

const tagSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    setImages(state, action: PayloadAction<TagState['images']>) {
      state.images = action.payload;
    },
  },
});

export const { setImages } = tagSlice.actions;
export default tagSlice.reducer;
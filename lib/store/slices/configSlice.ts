import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BackgroundConfig {
  image: string;
  brightness: number;
}

interface SearchConfig {
  engine: string;
  newTab: boolean;
}

interface ConfigState {
  background: BackgroundConfig;
  search: SearchConfig;
}

const initialState: ConfigState = {
  background: {
    image: '',
    brightness: 0.2,
  },
  search: {
    engine: 'google',
    newTab: true,
  },
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setBackgroundImage: (state, action: PayloadAction<string>) => {
      state.background.image = action.payload;
    },
    setBackgroundBrightness: (state, action: PayloadAction<number>) => {
      const brightness = action.payload;
      if (brightness >= 0 && brightness <= 1) {
        state.background.brightness = brightness;
      }
    },
    setBackgroundConfig: (state, action: PayloadAction<BackgroundConfig>) => {
      state.background = action.payload;
    },
    setSearchEngine: (state, action: PayloadAction<string>) => {
      state.search.engine = action.payload;
    },
    setSearchNewTab: (state, action: PayloadAction<boolean>) => {
      state.search.newTab = action.payload;
    },
    setSearchConfig: (state, action: PayloadAction<SearchConfig>) => {
      state.search = action.payload;
    },
  },
});

export const {
  setBackgroundImage,
  setBackgroundBrightness,
  setBackgroundConfig,
  setSearchEngine,
  setSearchNewTab,
  setSearchConfig
} = configSlice.actions;

export default configSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BackgroundConfig {
  image: string;
  brightness: number;
  blur: number;
}

interface SearchConfig {
  engine: string;
  newTab: boolean;
}

interface TerminalConfig {
  liveSuggestions: boolean;
}

interface ConfigState {
  background: BackgroundConfig;
  search: SearchConfig;
  terminal: TerminalConfig;
}

const initialState: ConfigState = {
  background: {
    image: '',
    brightness: 0.2,
    blur: 12,
  },
  search: {
    engine: 'google',
    newTab: true,
  },
  terminal: {
    liveSuggestions: true,
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
    setBackgroundBlur: (state, action: PayloadAction<number>) => {
      const blur = action.payload;
      if (blur >= 0 && blur <= 100) {
        state.background.blur = blur;
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
    setLiveSuggestions: (state, action: PayloadAction<boolean>) => {
      state.terminal.liveSuggestions = action.payload;
    },
    setTerminalConfig: (state, action: PayloadAction<TerminalConfig>) => {
      state.terminal = action.payload;
    },
  },
});

export const {
  setBackgroundImage,
  setBackgroundBrightness,
  setBackgroundBlur,
  setBackgroundConfig,
  setSearchEngine,
  setSearchNewTab,
  setSearchConfig,
  setLiveSuggestions,
  setTerminalConfig
} = configSlice.actions;

export default configSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TerminalTheme } from '../../themes/types';
import { presetThemes } from '../../themes/presets';

interface ThemeState {
  currentThemeName: string;
  customThemes: Record<string, TerminalTheme>;
}

const initialState: ThemeState = {
  currentThemeName: 'dark',
  customThemes: {},
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      const themeName = action.payload;
      const allThemes = { ...presetThemes, ...state.customThemes };
      if (allThemes[themeName]) {
        state.currentThemeName = themeName;
      }
    },
    addCustomTheme: (state, action: PayloadAction<TerminalTheme>) => {
      const theme = action.payload;
      state.customThemes[theme.name] = theme;
    },
    removeCustomTheme: (state, action: PayloadAction<string>) => {
      const themeName = action.payload;
      if (presetThemes[themeName]) {
        console.warn('Cannot remove preset theme:', themeName);
        return;
      }
      delete state.customThemes[themeName];
      if (state.currentThemeName === themeName) {
        state.currentThemeName = 'dark';
      }
    },
    importTheme: (state, action: PayloadAction<string>) => {
      try {
        const theme: TerminalTheme = JSON.parse(action.payload);
        if (!theme.name || !theme.colors || !theme.colors.background || !theme.colors.text) {
          throw new Error('Invalid theme structure');
        }
        state.customThemes[theme.name] = theme;
      } catch (error) {
        console.error('Failed to import theme:', error);
      }
    },
  },
});

export const { setTheme, addCustomTheme, removeCustomTheme, importTheme } = themeSlice.actions;

export default themeSlice.reducer;

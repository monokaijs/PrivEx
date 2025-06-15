import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';
import { presetThemes } from '../themes/presets';

export const selectCurrentThemeName = (state: RootState) => state.theme.currentThemeName;
export const selectCustomThemes = (state: RootState) => state.theme.customThemes;

export const selectAllThemes = createSelector(
  [selectCustomThemes],
  (customThemes) => ({ ...presetThemes, ...customThemes })
);

export const selectCurrentTheme = createSelector(
  [selectCurrentThemeName, selectAllThemes],
  (currentThemeName, allThemes) => allThemes[currentThemeName] || presetThemes.dark
);

export const selectBackgroundConfig = (state: RootState) => state.config.background;
export const selectBackgroundImage = (state: RootState) => state.config.background.image;
export const selectBackgroundBrightness = (state: RootState) => state.config.background.brightness;

export const selectSearchConfig = (state: RootState) => state.config.search;
export const selectSearchEngine = (state: RootState) => state.config.search.engine;
export const selectSearchNewTab = (state: RootState) => state.config.search.newTab;

export const selectTerminalConfig = (state: RootState) => state.config.terminal;
export const selectLiveSuggestions = (state: RootState) => state.config.terminal.liveSuggestions;

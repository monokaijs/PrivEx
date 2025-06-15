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
export const selectBackgroundBlur = (state: RootState) => state.config.background.blur;

export const selectSearchConfig = (state: RootState) => state.config.search;
export const selectSearchEngine = (state: RootState) => state.config.search.engine;
export const selectSearchNewTab = (state: RootState) => state.config.search.newTab;

export const selectTerminalConfig = (state: RootState) => state.config.terminal;
export const selectLiveSuggestions = (state: RootState) => state.config.terminal.liveSuggestions;

// OpenAI selectors
export const selectOpenAIConfig = (state: RootState) => state.openai.config;
export const selectOpenAIChats = (state: RootState) => state.openai.chats;
export const selectCurrentChatId = (state: RootState) => state.openai.currentChatId;
export const selectIsInChatMode = (state: RootState) => state.openai.isInChatMode;
export const selectIsStreaming = (state: RootState) => state.openai.isStreaming;

export const selectCurrentChat = createSelector(
  [selectCurrentChatId, selectOpenAIChats],
  (currentChatId, chats) => currentChatId ? chats[currentChatId] : null
);

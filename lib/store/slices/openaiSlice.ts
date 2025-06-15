import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chat, OpenAIConfig, OpenAIState, DEFAULT_OPENAI_CONFIG } from '../../services/openai-types';

const initialState: OpenAIState = {
  config: DEFAULT_OPENAI_CONFIG,
  chats: {},
  currentChatId: null,
  isInChatMode: false,
  isStreaming: false
};

const openaiSlice = createSlice({
  name: 'openai',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<OpenAIConfig>) => {
      state.config = action.payload;
    },
    updateConfig: (state, action: PayloadAction<Partial<OpenAIConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setChats: (state, action: PayloadAction<Record<string, Chat>>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats[action.payload.id] = action.payload;
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      state.chats[action.payload.id] = action.payload;
    },
    removeChat: (state, action: PayloadAction<string>) => {
      delete state.chats[action.payload];
      if (state.currentChatId === action.payload) {
        state.currentChatId = null;
        state.isInChatMode = false;
      }
    },
    clearAllChats: (state) => {
      state.chats = {};
      state.currentChatId = null;
      state.isInChatMode = false;
    },
    setCurrentChatId: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },
    enterChatMode: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
      state.isInChatMode = true;
    },
    exitChatMode: (state) => {
      state.isInChatMode = false;
      state.currentChatId = null;
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    }
  }
});

export const {
  setConfig,
  updateConfig,
  setChats,
  addChat,
  updateChat,
  removeChat,
  clearAllChats,
  setCurrentChatId,
  enterChatMode,
  exitChatMode,
  setStreaming
} = openaiSlice.actions;

export default openaiSlice.reducer;

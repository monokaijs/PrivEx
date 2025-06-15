import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import themeReducer from './slices/themeSlice';
import configReducer from './slices/configSlice';
import openaiReducer from './slices/openaiSlice';
import autoMergeLevel2 from "redux-persist/es/stateReconciler/autoMergeLevel2";

const rootReducer = combineReducers({
  theme: themeReducer,
  config: configReducer,
  openai: openaiReducer,
});

const persistedReducer = persistReducer({
  key: 'root',
  version: 1,
  storage,
  whitelist: ['theme', 'config', 'openai'],
  stateReconciler: autoMergeLevel2,
} as any, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

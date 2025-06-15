import { TerminalTheme } from './types';

export const darkTheme: TerminalTheme = {
  name: 'dark',
  displayName: 'Dark Terminal',
  author: 'MonokaiJs',
  description: 'Classic dark terminal theme with green text',
  version: '1.0.0',
  colors: {
    background: '#000000',
    backgroundSecondary: '#111111',
    text: '#ffffff',
    textSecondary: '#bdbdbd',
    textDim: '#666666',
    prompt: '#ffffff',
    cursor: '#ffffff',
    success: '#ffffff',
    error: '#ff0000',
    info: '#ffff00',
    warning: '#ff8800',
    selection: '#000000',
    selectionBackground: '#ffffff',
    scrollbar: '#ffffff',
    scrollbarTrack: '#000000',
    border: '#ffffff',
    accent: '#ffffff'
  },
  typography: {
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    fontSize: '14px',
    lineHeight: 1.4,
    fontWeight: 'normal'
  },
  animations: {
    cursorBlink: true,
    cursorBlinkSpeed: 500,
    textTransition: true
  },
  layout: {
    padding: '20px',
    borderRadius: '0px',
    maxWidth: '100%',
    maxHeight: '100vh'
  }
};

export const lightTheme: TerminalTheme = {
  name: 'light',
  displayName: 'Light Terminal',
  author: 'MonokaiJs',
  description: 'Clean light theme with dark text',
  version: '1.0.0',
  colors: {
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    text: '#333333',
    textSecondary: '#555555',
    textDim: '#999999',
    prompt: '#0066cc',
    cursor: '#0066cc',
    success: '#008800',
    error: '#cc0000',
    info: '#0066cc',
    warning: '#ff6600',
    selection: '#ffffff',
    selectionBackground: '#0066cc',
    scrollbar: '#cccccc',
    scrollbarTrack: '#f5f5f5',
    border: '#dddddd',
    accent: '#0066cc'
  },
  typography: {
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    fontSize: '14px',
    lineHeight: 1.4,
    fontWeight: 'normal'
  },
  animations: {
    cursorBlink: true,
    cursorBlinkSpeed: 500,
    textTransition: true
  },
  layout: {
    padding: '20px',
    borderRadius: '0px',
    maxWidth: '100%',
    maxHeight: '100vh'
  }
};

export const matrixTheme: TerminalTheme = {
  name: 'matrix',
  displayName: 'Matrix',
  author: 'MonokaiJs',
  description: 'Green matrix-style theme',
  version: '1.0.0',
  colors: {
    background: '#0d1117',
    backgroundSecondary: '#161b22',
    text: '#00ff41',
    textSecondary: '#00cc33',
    textDim: '#003311',
    prompt: '#00ff41',
    cursor: '#00ff41',
    success: '#00ff41',
    error: '#ff4444',
    info: '#44ff44',
    warning: '#ffff44',
    selection: '#0d1117',
    selectionBackground: '#00ff41',
    scrollbar: '#00ff41',
    scrollbarTrack: '#0d1117',
    border: '#00ff41',
    accent: '#00ff41'
  },
  typography: {
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    fontSize: '14px',
    lineHeight: 1.4,
    fontWeight: 'normal'
  },
  animations: {
    cursorBlink: true,
    cursorBlinkSpeed: 300,
    textTransition: true
  },
  layout: {
    padding: '20px',
    borderRadius: '0px',
    maxWidth: '100%',
    maxHeight: '100vh'
  }
};

export const retroTheme: TerminalTheme = {
  name: 'retro',
  displayName: 'Retro Amber',
  author: 'MonokaiJs',
  description: 'Vintage amber terminal theme',
  version: '1.0.0',
  colors: {
    background: '#1a0e00',
    backgroundSecondary: '#2a1800',
    text: '#ffb000',
    textSecondary: '#cc8800',
    textDim: '#664400',
    prompt: '#ffb000',
    cursor: '#ffb000',
    success: '#ffb000',
    error: '#ff4400',
    info: '#ffcc44',
    warning: '#ff8800',
    selection: '#1a0e00',
    selectionBackground: '#ffb000',
    scrollbar: '#ffb000',
    scrollbarTrack: '#1a0e00',
    border: '#ffb000',
    accent: '#ffb000'
  },
  typography: {
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    fontSize: '14px',
    lineHeight: 1.4,
    fontWeight: 'normal'
  },
  animations: {
    cursorBlink: true,
    cursorBlinkSpeed: 600,
    textTransition: true
  },
  layout: {
    padding: '20px',
    borderRadius: '0px',
    maxWidth: '100%',
    maxHeight: '100vh'
  }
};

export const presetThemes: Record<string, TerminalTheme> = {
  dark: darkTheme,
  light: lightTheme,
  matrix: matrixTheme,
  retro: retroTheme
};

export interface TerminalTheme {
  name: string;
  displayName: string;
  author?: string;
  description?: string;
  version?: string;
  colors: {
    background: string;
    backgroundSecondary?: string;
    text: string;
    textSecondary?: string;
    textDim?: string;
    prompt: string;
    cursor: string;
    success: string;
    error: string;
    info: string;
    warning?: string;
    selection?: string;
    selectionBackground?: string;
    scrollbar?: string;
    scrollbarTrack?: string;
    border?: string;
    accent?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string | number;
    fontWeight?: string | number;
  };

  // Animation settings
  animations?: {
    cursorBlink?: boolean;
    cursorBlinkSpeed?: number; // in milliseconds
    textTransition?: boolean;
  };
  layout?: {
    padding?: string;
    borderRadius?: string;
    maxWidth?: string;
    maxHeight?: string;
  };
}

export interface ThemeConfig {
  currentTheme: string;
  availableThemes: Record<string, TerminalTheme>;
  customThemes?: Record<string, TerminalTheme>;
}

export type ThemeContextType = {
  currentTheme: TerminalTheme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: Record<string, TerminalTheme>;
  addCustomTheme: (theme: TerminalTheme) => void;
  removeCustomTheme: (themeName: string) => void;
  exportTheme: (themeName: string) => string;
  importTheme: (themeJson: string) => boolean;
};

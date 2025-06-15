import { TerminalTheme } from './types';
import { getBackgroundConfig, applyBackgroundConfig } from '../commands/config';

/**
 * Apply theme styles to the document
 */
export async function applyThemeStyles(theme: TerminalTheme): Promise<void> {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--terminal-bg', theme.colors.background);
  root.style.setProperty('--terminal-bg-secondary', theme.colors.backgroundSecondary || theme.colors.background);
  root.style.setProperty('--terminal-text', theme.colors.text);
  root.style.setProperty('--terminal-text-secondary', theme.colors.textSecondary || theme.colors.text);
  root.style.setProperty('--terminal-text-dim', theme.colors.textDim || theme.colors.text);
  root.style.setProperty('--terminal-prompt', theme.colors.prompt);
  root.style.setProperty('--terminal-cursor', theme.colors.cursor);
  root.style.setProperty('--terminal-success', theme.colors.success);
  root.style.setProperty('--terminal-error', theme.colors.error);
  root.style.setProperty('--terminal-info', theme.colors.info);
  root.style.setProperty('--terminal-warning', theme.colors.warning || theme.colors.info);
  root.style.setProperty('--terminal-selection', theme.colors.selection || theme.colors.background);
  root.style.setProperty('--terminal-selection-bg', theme.colors.selectionBackground || theme.colors.text);
  root.style.setProperty('--terminal-scrollbar', theme.colors.scrollbar || theme.colors.text);
  root.style.setProperty('--terminal-scrollbar-track', theme.colors.scrollbarTrack || theme.colors.background);
  root.style.setProperty('--terminal-border', theme.colors.border || theme.colors.text);
  root.style.setProperty('--terminal-accent', theme.colors.accent || theme.colors.text);
  
  // Apply typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      root.style.setProperty('--terminal-font-family', theme.typography.fontFamily);
    }
    if (theme.typography.fontSize) {
      root.style.setProperty('--terminal-font-size', theme.typography.fontSize);
    }
    if (theme.typography.lineHeight) {
      root.style.setProperty('--terminal-line-height', theme.typography.lineHeight.toString());
    }
    if (theme.typography.fontWeight) {
      root.style.setProperty('--terminal-font-weight', theme.typography.fontWeight.toString());
    }
  }
  
  // Apply layout
  if (theme.layout) {
    if (theme.layout.padding) {
      root.style.setProperty('--terminal-padding', theme.layout.padding);
    }
    if (theme.layout.borderRadius) {
      root.style.setProperty('--terminal-border-radius', theme.layout.borderRadius);
    }
  }
  
  // Apply animation settings
  if (theme.animations) {
    if (theme.animations.cursorBlinkSpeed) {
      root.style.setProperty('--terminal-cursor-blink-speed', `${theme.animations.cursorBlinkSpeed}ms`);
    }
  }

  try {
    const backgroundConfig = await getBackgroundConfig();
    applyBackgroundConfig(backgroundConfig);
  } catch (error) {
    console.warn('Failed to apply background config:', error);
  }
}

/**
 * Generate CSS string from theme
 */
export function generateThemeCSS(theme: TerminalTheme): string {
  const css = `
/* ${theme.displayName} Theme */
:root {
  --terminal-bg: ${theme.colors.background};
  --terminal-bg-secondary: ${theme.colors.backgroundSecondary || theme.colors.background};
  --terminal-text: ${theme.colors.text};
  --terminal-text-secondary: ${theme.colors.textSecondary || theme.colors.text};
  --terminal-text-dim: ${theme.colors.textDim || theme.colors.text};
  --terminal-prompt: ${theme.colors.prompt};
  --terminal-cursor: ${theme.colors.cursor};
  --terminal-success: ${theme.colors.success};
  --terminal-error: ${theme.colors.error};
  --terminal-info: ${theme.colors.info};
  --terminal-warning: ${theme.colors.warning || theme.colors.info};
  --terminal-selection: ${theme.colors.selection || theme.colors.background};
  --terminal-selection-bg: ${theme.colors.selectionBackground || theme.colors.text};
  --terminal-scrollbar: ${theme.colors.scrollbar || theme.colors.text};
  --terminal-scrollbar-track: ${theme.colors.scrollbarTrack || theme.colors.background};
  --terminal-border: ${theme.colors.border || theme.colors.text};
  --terminal-accent: ${theme.colors.accent || theme.colors.text};
  
  ${theme.typography?.fontFamily ? `--terminal-font-family: ${theme.typography.fontFamily};` : ''}
  ${theme.typography?.fontSize ? `--terminal-font-size: ${theme.typography.fontSize};` : ''}
  ${theme.typography?.lineHeight ? `--terminal-line-height: ${theme.typography.lineHeight};` : ''}
  ${theme.typography?.fontWeight ? `--terminal-font-weight: ${theme.typography.fontWeight};` : ''}
  
  ${theme.layout?.padding ? `--terminal-padding: ${theme.layout.padding};` : ''}
  ${theme.layout?.borderRadius ? `--terminal-border-radius: ${theme.layout.borderRadius};` : ''}
  
  ${theme.animations?.cursorBlinkSpeed ? `--terminal-cursor-blink-speed: ${theme.animations.cursorBlinkSpeed}ms;` : ''}
}
`;
  
  return css;
}

/**
 * Validate theme structure
 */
export function validateTheme(theme: any): theme is TerminalTheme {
  if (!theme || typeof theme !== 'object') return false;
  if (!theme.name || typeof theme.name !== 'string') return false;
  if (!theme.colors || typeof theme.colors !== 'object') return false;
  if (!theme.colors.background || typeof theme.colors.background !== 'string') return false;
  if (!theme.colors.text || typeof theme.colors.text !== 'string') return false;
  if (!theme.colors.prompt || typeof theme.colors.prompt !== 'string') return false;
  if (!theme.colors.cursor || typeof theme.colors.cursor !== 'string') return false;
  if (!theme.colors.success || typeof theme.colors.success !== 'string') return false;
  if (!theme.colors.error || typeof theme.colors.error !== 'string') return false;
  if (!theme.colors.info || typeof theme.colors.info !== 'string') return false;
  
  return true;
}

/**
 * Create a theme from a color palette
 */
export function createThemeFromPalette(
  name: string,
  displayName: string,
  palette: {
    background: string;
    text: string;
    accent: string;
    success?: string;
    error?: string;
    info?: string;
  }
): TerminalTheme {
  return {
    name,
    displayName,
    colors: {
      background: palette.background,
      text: palette.text,
      prompt: palette.accent,
      cursor: palette.accent,
      success: palette.success || palette.accent,
      error: palette.error || '#ff0000',
      info: palette.info || palette.accent,
      accent: palette.accent
    }
  };
}

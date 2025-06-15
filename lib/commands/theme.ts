import { defineCommand } from './types';
import { store } from '../store';
import { setTheme, addCustomTheme, removeCustomTheme, importTheme } from '../store/slices/themeSlice';
import { selectCurrentTheme, selectCurrentThemeName, selectAllThemes } from '../store/selectors';

export const themeCommand = defineCommand({
  name: 'theme',
  description: 'Manage terminal themes',
  category: 'customization',
  args: [
    {
      name: 'action',
      type: ['list', 'set', 'export', 'import', 'current'],
      description: 'Action to perform',
      required: false,
      default: 'list',
      nested: [
        {
          name: 'list',
          type: 'string',
          description: 'List all available themes'
        },
        {
          name: 'set',
          type: 'string',
          description: 'Set active theme',
          nested: [
            {
              name: 'themeName',
              type: 'theme',
              description: 'Name of the theme to activate',
              required: true
            }
          ]
        },
        {
          name: 'export',
          type: 'string',
          description: 'Export theme to JSON',
          nested: [
            {
              name: 'themeName',
              type: 'theme',
              description: 'Name of the theme to export',
              required: true
            }
          ]
        },
        {
          name: 'import',
          type: 'string',
          description: 'Import theme from JSON',
          nested: [
            {
              name: 'themeJson',
              type: 'string',
              description: 'JSON string of the theme to import',
              required: true
            }
          ]
        },
        {
          name: 'current',
          type: 'string',
          description: 'Show current theme information'
        }
      ]
    }
  ],
  examples: [
    'theme',
    'theme list',
    'theme set dark',
    'theme export matrix',
    'theme current'
  ],
  handler: (ctx, args) => {
    const state = store.getState();
    const currentTheme = selectCurrentTheme(state);
    const currentThemeName = selectCurrentThemeName(state);
    const allThemes = selectAllThemes(state);

    const action = args.action || 'list';

    if (action === 'list') {
      const themes = Object.values(allThemes);

      let output = 'Available themes:\n';
      themes.forEach((theme: any) => {
        const marker = theme.name === currentThemeName ? '* ' : '  ';
        const author = theme.author ? ` (by ${theme.author})` : '';
        output += `${marker}${theme.name.padEnd(12)} - ${theme.displayName}${author}\n`;
      });

      output += '\nUse "theme set <name>" to switch themes';
      return output;
    }

    if (action === 'set') {
      const themeName = args.themeName;
      if (allThemes[themeName]) {
        store.dispatch(setTheme(themeName));
        return `Switched to theme: ${themeName}`;
      } else {
        return `Theme not found: ${themeName}. Use "theme list" to see available themes.`;
      }
    }

    if (action === 'export') {
      const themeName = args.themeName;
      try {
        const theme = allThemes[themeName];
        if (!theme) {
          return `Theme not found: ${themeName}`;
        }

        const themeJson = JSON.stringify(theme, null, 2);

        if (navigator.clipboard) {
          navigator.clipboard.writeText(themeJson);
          return `Theme "${themeName}" exported and copied to clipboard.`;
        } else {
          return `Theme "${themeName}" exported:\n\n${themeJson}`;
        }
      } catch (error) {
        return `Failed to export theme: ${error}`;
      }
    }

    if (action === 'import') {
      const themeJson = args.themeJson;
      try {
        store.dispatch(importTheme(themeJson));
        return 'Theme imported successfully!';
      } catch (error) {
        return `Failed to import theme: ${error}`;
      }
    }

    if (action === 'current') {
      return `Current theme: ${currentTheme.name} (${currentTheme.displayName})
Author: ${currentTheme.author || 'Unknown'}
Description: ${currentTheme.description || 'No description'}`;
    }

    return 'Unknown action';
  }
});

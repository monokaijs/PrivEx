import { defineCommand } from './types';
import packageJson from '../../package.json';

export const aboutCommand = defineCommand({
  name: 'about',
  description: 'Show information about this extension',
  category: 'information',
  examples: ['about'],
  handler: (ctx, args) => {
    return `Privex Extension
Version: ${packageJson.version || 'unknown'}
A terminal-style new tab page for Chrome

Features:
- Command-based navigation
- Extensible command system
- Full terminal emulation with xterm.js
- Theme system with customizable colors
- Command history navigation

Type "help" to see available commands.`;
  }
});

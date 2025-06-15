import { defineCommand } from './types';

export const clearCommand = defineCommand({
  name: ['clear', 'cls'],
  description: 'Clear the terminal screen',
  category: 'terminal',
  examples: [
    'clear',
    'cls'
  ],
  handler: (ctx, args) => {
    const terminal = (window as any).__terminalInstance;

    if (terminal) {
      terminal.clear();
    }

    ctx.setHistory([]);
    ctx.setInput('');
    return;
  }
});

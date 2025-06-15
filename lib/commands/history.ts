import { defineCommand } from './types';

export const historyCommand = defineCommand({
  name: ['history', 'his'],
  description: 'Show or manage command history',
  category: 'terminal',
  args: [
    {
      name: 'action',
      type: ['clear'],
      description: 'Action to perform on history',
      required: false
    }
  ],
  examples: [
    'history',
    'history clear',
    'hist'
  ],
  handler: (ctx, args) => {
    if (args.action === 'clear') {
      ctx.setCommandHistory([]);
      return 'Command history cleared.';
    }

    if (ctx.commandHistory.length === 0) {
      return 'No command history available.';
    }

    return ctx.commandHistory
      .map((cmd, index) => `${(index + 1).toString().padStart(3)}: ${cmd}`)
      .join('\n');
  }
});

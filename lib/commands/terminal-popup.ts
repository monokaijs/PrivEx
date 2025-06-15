import { defineCommand } from './types';

export const terminalPopupCommand = defineCommand({
  name: 't',
  description: 'Open an embedded terminal popup for multitasking',
  category: 'terminal',
  examples: [
    't'
  ],
  handler: (ctx, args) => {
    const event = new CustomEvent('openTerminalPopup');
    window.dispatchEvent(event);
    return;
  }
});

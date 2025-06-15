import { defineCommand } from './types';

export const timeCommand = defineCommand({
  name: 'time',
  description: 'Display current date and time',
  category: 'utilities',
  args: [
    {
      name: 'format',
      type: ['iso', 'utc', 'date', 'time', 'unix'],
      description: 'Output format for the time',
      required: false,
      default: 'locale'
    }
  ],
  examples: [
    'time',
    'time iso',
    'time utc',
    'time unix'
  ],
  handler: (ctx, args) => {
    const now = new Date();
    const { format } = args;

    switch (format) {
      case 'iso':
        return now.toISOString();
      case 'utc':
        return now.toUTCString();
      case 'date':
        return now.toDateString();
      case 'time':
        return now.toTimeString();
      case 'unix':
        return Math.floor(now.getTime() / 1000).toString();
      default:
        return now.toLocaleString();
    }
  }
});

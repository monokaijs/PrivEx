import { defineCommand } from './types';

export const echoCommand = defineCommand({
  name: 'echo',
  description: 'Display a line of text',
  category: 'utilities',
  args: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to display',
      required: true
    }
  ],
  examples: [
    'echo Hello World',
    'echo "This is a test"'
  ],
  handler: (ctx, args) => {
    return args.text;
  }
});

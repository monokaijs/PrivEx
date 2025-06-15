import { defineCommand } from './types';

export const openCommand = defineCommand({
  name: 'open',
  description: 'Navigate to a URL',
  category: 'navigation',
  args: [
    {
      name: 'url',
      type: 'url',
      description: 'URL to navigate to',
      required: true
    }
  ],
  examples: [
    'open google.com',
    'open https://github.com',
    'open youtube.com'
  ],
  handler: (ctx, args) => {
    const { url } = args;

    try {
      // Navigate to the URL (url type already handles protocol addition)
      window.location.href = url;
      return `Opening ${url}...`;
    } catch (error) {
      return `Error opening URL: ${error}`;
    }
  }
});

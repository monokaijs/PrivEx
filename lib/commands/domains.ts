import { defineCommand } from './types';
import { domainService } from '../services/domains';

export const domainsCommand = defineCommand({
  name: ['domains', 'history-domains'],
  description: 'Show and manage real-time domain suggestions from Chrome history',
  category: 'information',
  args: [
    {
      name: 'action',
      type: ['test', 'cache', 'clear'],
      description: 'Action to perform: test, cache, or clear',
      required: false,
      default: 'test'
    },
    {
      name: 'query',
      type: 'string',
      description: 'Search term to test domain suggestions (for test action)',
      required: false
    }
  ],
  examples: [
    'domains',
    'domains test git',
    'domains test google',
    'domains cache',
    'domains clear'
  ],
  handler: async (ctx, args) => {
    const action = args.action || 'test';

    try {
      switch (action) {
        case 'test': {
          const query = args.query || 'git';

          console.log(`Testing domain suggestions for: "${query}"`);
          const startTime = Date.now();
          const domains = await domainService.getDomainSuggestions(query, 10);
          const endTime = Date.now();

          if (domains.length === 0) {
            return `No domains found for "${query}".

This could mean:
- No matching domains in Chrome history
- Extension doesn't have history permissions
- Search term too specific

Try a different search term like: domains test google`;
          }

          let output = `Domain Suggestions for "${query}" (${endTime - startTime}ms):\n\n`;
          domains.forEach((domain, index) => {
            output += `${(index + 1).toString().padStart(2)}. 🌐 ${domain}\n`;
          });

          output += `\nThese domains appear as live suggestions when typing "${query}" in the terminal.`;
          return output;
        }

        case 'cache': {
          const stats = domainService.getCacheStats();
          const hasCached = domainService.hasCachedData();

          return `Domain Cache Statistics:
Cache entries: ${stats.entries}
Unique domains: ${stats.totalDomains}
Has cached data: ${hasCached ? 'Yes' : 'No'}

The cache stores recent search results for 5 minutes to improve performance.
Domains are searched in real-time from Chrome history when you type.`;
        }

        case 'clear': {
          domainService.clearCache();
          return `Domain cache cleared.

Next domain search will query Chrome history directly.
Cache will rebuild automatically as you type commands.`;
        }

        default:
          return `Unknown action: ${action}. Use: test, cache, or clear`;
      }
    } catch (error) {
      return `Error accessing domain data: ${error}

Make sure the extension has history permissions.`;
    }
  }
});

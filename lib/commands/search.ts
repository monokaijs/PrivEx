import { defineCommand } from './types';
import { store } from '../store';
import { setSearchEngine, setSearchNewTab } from '../store/slices/configSlice';
import { selectSearchConfig } from '../store/selectors';

const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    homepage: 'https://www.google.com',
    searchUrl: 'https://www.google.com/search?q=',
    aliases: ['google', 'g']
  },
  bing: {
    name: 'Bing',
    homepage: 'https://www.bing.com',
    searchUrl: 'https://www.bing.com/search?q=',
    aliases: ['bing', 'b']
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    homepage: 'https://duckduckgo.com',
    searchUrl: 'https://duckduckgo.com/?q=',
    aliases: ['duckduckgo', 'ddg', 'd']
  },
  youtube: {
    name: 'YouTube',
    homepage: 'https://www.youtube.com',
    searchUrl: 'https://www.youtube.com/results?search_query=',
    aliases: ['youtube', 'yt', 'y']
  },
  github: {
    name: 'GitHub',
    homepage: 'https://github.com',
    searchUrl: 'https://github.com/search?q=',
    aliases: ['github', 'gh']
  },
  stackoverflow: {
    name: 'Stack Overflow',
    homepage: 'https://stackoverflow.com',
    searchUrl: 'https://stackoverflow.com/search?q=',
    aliases: ['stackoverflow', 'so', 'stack']
  }
} as const;

type SearchEngine = keyof typeof SEARCH_ENGINES;



// Default configuration
const DEFAULT_CONFIG = {
  engine: 'google' as SearchEngine,
  newTab: false
};

/**
 * Get current search configuration
 */
function getSearchConfig() {
  const state = store.getState();
  return selectSearchConfig(state);
}

/**
 * search - Unified search command with configurable engine
 */
export const searchCommand = defineCommand({
  name: ['search'],
  description: 'Search using configured search engine or navigate to homepage',
  category: 'navigation',
  args: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query (optional)',
      required: false
    }
  ],
  examples: [
    'search',
    'search javascript tutorials',
    'search "how to code"',
    'search react hooks examples'
  ],
  handler: async (ctx, args) => {
    try {
      const config = getSearchConfig();
      const engineConfig = SEARCH_ENGINES[config.engine as SearchEngine];

      if (!engineConfig) {
        return `Error: Unknown search engine "${config.engine}". Use search-config to set a valid engine.`;
      }

      let url: string;

      if (args.query && args.query.trim()) {
        // Encode the search query for URL
        const encodedQuery = encodeURIComponent(args.query.trim());
        url = engineConfig.searchUrl + encodedQuery;
      } else {
        // No query provided, go to homepage
        url = engineConfig.homepage;
      }

      // Navigate to the URL
      if (config.newTab) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }

      const target = config.newTab ? ' (new tab)' : '';

      if (args.query && args.query.trim()) {
        return `Searching ${engineConfig.name} for: "${args.query}"${target}`;
      } else {
        return `Opening ${engineConfig.name} homepage${target}...`;
      }
    } catch (error) {
      return `Error opening search: ${error}`;
    }
  }
});

/**
 * search-config - Configure search engine and behavior
 */
export const searchConfigCommand = defineCommand({
  name: ['search-config'],
  description: 'Configure search engine and behavior',
  category: 'configuration',
  args: [
    {
      name: 'setting',
      type: ['engine', 'newtab', 'show'],
      description: 'Setting to configure: engine, newtab, or show',
      required: true
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to set (engine name, enabled/disabled, or omit for show)',
      required: false
    }
  ],
  examples: [
    'search-config show',
    'search-config engine google',
    'search-config engine duckduckgo',
    'search-config newtab enabled',
    'search-config newtab disabled'
  ],
  handler: async (ctx, args) => {
    try {
      const setting = args.setting;
      const value = args.value;

      if (setting === 'show') {
        // Show current configuration
        const config = getSearchConfig();
        const engineConfig = SEARCH_ENGINES[config.engine as SearchEngine];

        const availableEngines = Object.keys(SEARCH_ENGINES).join(', ');

        return `Search Configuration:
Engine: ${config.engine} (${engineConfig.name})
New Tab: ${config.newTab ? 'enabled' : 'disabled'}
Homepage: ${engineConfig.homepage}

Available engines: ${availableEngines}

Usage:
  search-config engine <engine>     Set search engine
  search-config newtab <enabled|disabled>  Set new tab behavior`;
      }

      if (setting === 'engine') {
        if (!value) {
          const availableEngines = Object.keys(SEARCH_ENGINES).join(', ');
          return `Please specify an engine. Available engines: ${availableEngines}`;
        }

        const engineKey = value.toLowerCase() as SearchEngine;

        // Check if it's a valid engine or alias
        let validEngine: SearchEngine | null = null;

        if (SEARCH_ENGINES[engineKey]) {
          validEngine = engineKey;
        } else {
          // Check aliases
          for (const [key, config] of Object.entries(SEARCH_ENGINES)) {
            if ((config.aliases as unknown as any[]).includes(value.toLowerCase())) {
              validEngine = key as SearchEngine;
              break;
            }
          }
        }

        if (!validEngine) {
          const availableEngines = Object.keys(SEARCH_ENGINES).join(', ');
          return `Invalid engine "${value}". Available engines: ${availableEngines}`;
        }

        store.dispatch(setSearchEngine(validEngine));
        const engineConfig = SEARCH_ENGINES[validEngine];
        return `Search engine set to: ${engineConfig.name}`;
      }

      if (setting === 'newtab') {
        if (!value) {
          return 'Please specify enabled or disabled for newtab setting';
        }

        const enabled = value.toLowerCase() === 'enabled' || value.toLowerCase() === 'true';
        const disabled = value.toLowerCase() === 'disabled' || value.toLowerCase() === 'false';

        if (!enabled && !disabled) {
          return 'Please specify "enabled" or "disabled" for newtab setting';
        }

        store.dispatch(setSearchNewTab(enabled));
        return `New tab behavior: ${enabled ? 'enabled' : 'disabled'}`;
      }

      return 'Invalid setting. Use: engine, newtab, or show';
    } catch (error) {
      return `Error configuring search: ${error}`;
    }
  }
});

/**
 * youtube - Search on YouTube (popular shortcut)
 */
export const youtubeCommand = defineCommand({
  name: ['youtube', 'yt'],
  description: 'Search on YouTube or navigate to YouTube homepage',
  category: 'navigation',
  args: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query (optional)',
      required: false
    }
  ],
  examples: [
    'youtube',
    'yt programming tutorials',
    'youtube "javascript course"'
  ],
  handler: (ctx, args) => {
    try {
      let url: string;

      if (args.query && args.query.trim()) {
        const encodedQuery = encodeURIComponent(args.query.trim());
        url = `https://www.youtube.com/results?search_query=${encodedQuery}`;
      } else {
        url = 'https://www.youtube.com';
      }

      window.open(url, '_blank');

      if (args.query && args.query.trim()) {
        return `Searching YouTube for: "${args.query}"`;
      } else {
        return 'Opening YouTube homepage...';
      }
    } catch (error) {
      return `Error opening search: ${error}`;
    }
  }
});

/**
 * stackoverflow - Search on Stack Overflow (popular shortcut)
 */
export const stackoverflowCommand = defineCommand({
  name: ['stackoverflow', 'so'],
  description: 'Search on Stack Overflow or navigate to Stack Overflow homepage',
  category: 'navigation',
  args: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query (optional)',
      required: false
    }
  ],
  examples: [
    'stackoverflow',
    'so javascript error',
    'stackoverflow "react hooks"'
  ],
  handler: (ctx, args) => {
    try {
      let url: string;

      if (args.query && args.query.trim()) {
        const encodedQuery = encodeURIComponent(args.query.trim());
        url = `https://stackoverflow.com/search?q=${encodedQuery}`;
      } else {
        url = 'https://stackoverflow.com';
      }

      window.open(url, '_blank');

      if (args.query && args.query.trim()) {
        return `Searching Stack Overflow for: "${args.query}"`;
      } else {
        return 'Opening Stack Overflow homepage...';
      }
    } catch (error) {
      return `Error opening search: ${error}`;
    }
  }
});

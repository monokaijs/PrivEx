import {fileSystem} from './filesystem';
import {PathUtils} from './filesystem-types';
import {getRegisteredCommands} from '../commands/registry';
import {presetThemes} from '../themes/presets';
import {store} from '../store';
import {selectCustomThemes} from '../store/selectors';
import {domainService} from './domains';

export interface CompletionProvider {
  name: string;
  canComplete: (context: CompletionContext) => boolean;
  getCompletions: (context: CompletionContext) => Promise<string[]> | string[];
  priority?: number; // Higher priority providers appear first
}

export interface CompletionContext {
  input: string;
  cursorPosition: number;
  commandName?: string;
  args: string[];
  currentArg: string;
  argIndex: number;
  isCommandPosition: boolean;
}

/**
 * Command name completion provider
 */
export const commandCompletionProvider: CompletionProvider = {
  name: 'commands',
  priority: 100, // High priority for commands
  canComplete: (context) => context.isCommandPosition,
  getCompletions: (context) => {
    const commands = getRegisteredCommands();
    const commandNames = new Set<string>();

    // Add primary command names and aliases
    Object.values(commands).forEach(cmd => {
      commandNames.add(cmd.name);
      cmd.aliases.forEach(alias => commandNames.add(alias));
    });

    return Array.from(commandNames)
      .filter(name => name.toLowerCase().startsWith(context.currentArg.toLowerCase()))
      .sort();
  }
};

/**
 * Domain completion provider - suggests domains from Chrome history in real-time
 */
export const domainCompletionProvider: CompletionProvider = {
  name: 'domains',
  priority: 50, // Lower priority than commands but higher than files
  canComplete: (context) => {
    // Only suggest domains when:
    // 1. Typing the first command (no spaces in input yet)
    // 2. At least 2 characters typed
    // 3. Currently in command position
    const hasNoSpaces = !context.input.includes(' ');
    return context.isCommandPosition && context.currentArg.length >= 2 && hasNoSpaces;
  },
  getCompletions: async (context) => {
    try {
      // Get domain suggestions in real-time (limit to 5 for good UX)
      const domains = await domainService.getDomainSuggestions(context.currentArg, 5);

      return domains;
    } catch (error) {
      console.warn('Domain completion provider failed:', error);
      return [];
    }
  }
};

/**
 * File and directory completion provider
 */
export const fileCompletionProvider: CompletionProvider = {
  name: 'files',
  canComplete: (context) => !context.isCommandPosition,
  getCompletions: async (context) => {
    try {
      await fileSystem.initialize();

      // Determine the directory to search in
      let searchDir: string;
      let filePrefix: string;

      if (context.currentArg.includes('/')) {
        // Path contains directory separators
        const lastSlash = context.currentArg.lastIndexOf('/');
        const dirPart = context.currentArg.substring(0, lastSlash + 1);
        filePrefix = context.currentArg.substring(lastSlash + 1);

        if (dirPart.startsWith('/')) {
          // Absolute path
          searchDir = PathUtils.normalize(dirPart);
        } else {
          // Relative path
          const currentDir = fileSystem.getCurrentDirectory();
          searchDir = PathUtils.resolve(currentDir, dirPart);
        }
      } else {
        // No directory separators, search in current directory
        searchDir = fileSystem.getCurrentDirectory();
        filePrefix = context.currentArg;
      }

      // List directory contents
      const items = await fileSystem.listDirectory(searchDir, {
        showHidden: filePrefix.startsWith('.'),
        sortBy: 'name'
      });

      // Filter and format results
      const completions: string[] = [];

      for (const item of items) {
        if (!item.name.toLowerCase().startsWith(filePrefix.toLowerCase())) {
          continue;
        }

        // Format the completion
        let completion = item.name;

        // Add trailing slash for directories
        if (item.type === 'directory') {
          completion += '/';
        }

        // If we had a directory prefix, include it
        if (context.currentArg.includes('/')) {
          const dirPart = context.currentArg.substring(0, context.currentArg.lastIndexOf('/') + 1);
          completion = dirPart + completion;
        }

        completions.push(completion);
      }

      return completions;
    } catch (error) {
      // If directory doesn't exist or can't be read, return empty
      return [];
    }
  }
};

/**
 * Theme name completion provider
 */
export const themeCompletionProvider: CompletionProvider = {
  name: 'themes',
  canComplete: (context) => {
    return context.commandName === 'theme' &&
      context.args.length > 0 &&
      ['set', 'export'].includes(context.args[0]);
  },
  getCompletions: (context) => {
    const state = store.getState();
    const customThemes = selectCustomThemes(state);

    const allThemes = {...presetThemes, ...customThemes};
    return Object.keys(allThemes)
      .filter(name => name.toLowerCase().startsWith(context.currentArg.toLowerCase()))
      .sort();
  }
};

/**
 * Search engine completion provider
 */
export const searchEngineCompletionProvider: CompletionProvider = {
  name: 'searchEngines',
  canComplete: (context) => {
    return context.commandName === 'search-config' &&
      context.args.length > 0 &&
      context.args[0] === 'engine';
  },
  getCompletions: (context) => {
    const engines = ['google', 'bing', 'duckduckgo', 'yahoo'];
    return engines.filter(engine =>
      engine.toLowerCase().startsWith(context.currentArg.toLowerCase())
    );
  }
};

/**
 * Config option completion provider
 */
export const configCompletionProvider: CompletionProvider = {
  name: 'config',
  canComplete: (context) => context.commandName === 'config',
  getCompletions: (context) => {
    if (context.argIndex === 0) {
      // First argument - config sections
      const sections = ['background', 'terminal', 'show'];
      return sections.filter(section =>
        section.toLowerCase().startsWith(context.currentArg.toLowerCase())
      );
    } else if (context.argIndex === 1 && context.args[0] === 'background') {
      // Second argument for background config
      const properties = ['image', 'brightness', 'blur'];
      return properties.filter(prop =>
        prop.toLowerCase().startsWith(context.currentArg.toLowerCase())
      );
    } else if (context.argIndex === 1 && context.args[0] === 'terminal') {
      // Second argument for terminal config
      const properties = ['live-suggestions'];
      return properties.filter(prop =>
        prop.toLowerCase().startsWith(context.currentArg.toLowerCase())
      );
    }
    return [];
  }
};

/**
 * Boolean completion provider for flags
 */
export const booleanCompletionProvider: CompletionProvider = {
  name: 'boolean',
  canComplete: (context) => {
    // Check if current argument expects a boolean
    return context.currentArg.toLowerCase().startsWith('t') ||
      context.currentArg.toLowerCase().startsWith('f') ||
      context.currentArg.toLowerCase().startsWith('y') ||
      context.currentArg.toLowerCase().startsWith('n');
  },
  getCompletions: (context) => {
    const booleans = ['true', 'false', 'yes', 'no'];
    return booleans.filter(bool =>
      bool.toLowerCase().startsWith(context.currentArg.toLowerCase())
    );
  }
};

/**
 * URL completion provider for open command
 */
export const urlCompletionProvider: CompletionProvider = {
  name: 'urls',
  canComplete: (context) => {
    return context.commandName === 'open' ||
      (context.commandName === 'config' &&
        context.args[0] === 'background' &&
        context.args[1] === 'image');
  },
  getCompletions: (context) => {
    const commonUrls = [
      'github.com',
      'stackoverflow.com',
      'google.com',
      'youtube.com',
      'reddit.com',
      'twitter.com',
      'facebook.com',
      'linkedin.com',
      'wikipedia.org',
      'mozilla.org'
    ];

    // Add protocol if not present
    return commonUrls
      .filter(url => url.toLowerCase().includes(context.currentArg.toLowerCase()))
      .map(url => {
        if (context.currentArg.startsWith('http')) {
          return url.startsWith('http') ? url : `https://${url}`;
        }
        return url;
      });
  }
};

/**
 * Google search suggestions provider for queries with whitespace
 */
export const googleSuggestionsProvider: CompletionProvider = {
  name: 'googleSuggestions',
  priority: 30, // Lower priority than commands and domains
  canComplete: (context) => {
    // Only suggest when:
    // 1. Input contains whitespace (indicating it's a search query, not a command)
    // 2. First word doesn't match any existing command
    // 3. At least 3 characters typed for meaningful suggestions
    const hasWhitespace = context.input.includes(' ');
    const isLongEnough = context.input.trim().length >= 3;

    if (!hasWhitespace || !isLongEnough) {
      return false;
    }

    // Check if first word matches any command
    const firstWord = context.input.trim().split(' ')[0].toLowerCase();
    const commands = getRegisteredCommands();
    const commandExists = commands[firstWord] !== undefined;

    return !commandExists;
  },
  getCompletions: async (context) => {
    try {
      const query = context.input.trim();
      const suggestions = await fetchGoogleSuggestions(query);
      return suggestions;
    } catch (error) {
      console.warn('Google suggestions provider failed:', error);
      return [];
    }
  }
};

/**
 * Fetch Google search suggestions using fetch API
 */
async function fetchGoogleSuggestions(query: string): Promise<string[]> {
  try {
    const trimmedQuery = query.substring(0, 100);
    const endpoint = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(trimmedQuery)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Suggestions are in the second element of the response array
    if (data && data[1] && Array.isArray(data[1])) {
      return data[1]
        .slice(0, 5) // Limit to 5 suggestions
        .filter((suggestion: string) => suggestion && suggestion.trim().length > 0);
    }

    return [];
  } catch (error) {
    console.warn('Failed to fetch Google suggestions:', error);
    return getFallbackSuggestions(query);
  }
}

/**
 * Generate intelligent fallback suggestions when API fails
 */
function getFallbackSuggestions(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();

  // Common programming and tech-related suggestions
  const suggestionPatterns: Record<string, string[]> = {
    'how to': [
      'how to learn programming',
      'how to code',
      'how to debug',
      'how to optimize performance',
      'how to deploy applications'
    ],
    'javascript': [
      'javascript tutorial',
      'javascript frameworks',
      'javascript best practices',
      'javascript async await',
      'javascript debugging tips'
    ],
    'react': [
      'react hooks tutorial',
      'react components guide',
      'react state management',
      'react best practices',
      'react performance optimization'
    ],
    'python': [
      'python tutorial for beginners',
      'python data science',
      'python web development',
      'python automation scripts',
      'python best practices'
    ],
    'css': [
      'css grid layout',
      'css flexbox guide',
      'css animations tutorial',
      'css responsive design',
      'css best practices'
    ]
  };

  // Find matching suggestions based on keywords
  for (const [keyword, suggestions] of Object.entries(suggestionPatterns)) {
    if (lowerQuery.includes(keyword)) {
      return suggestions
        .filter(suggestion =>
          suggestion.toLowerCase().includes(lowerQuery) ||
          lowerQuery.includes(keyword)
        )
        .slice(0, 5);
    }
  }

  // Generic suggestions based on common question patterns
  if (lowerQuery.startsWith('how to ')) {
    const topic = lowerQuery.replace('how to ', '');
    return [
      `how to ${topic} tutorial`,
      `how to ${topic} step by step`,
      `how to ${topic} best practices`,
      `how to ${topic} examples`,
      `how to ${topic} guide`
    ].slice(0, 5);
  }

  // Default suggestions
  return [
    `${query} tutorial`,
    `${query} guide`,
    `${query} examples`,
    `${query} best practices`,
    `${query} documentation`
  ].slice(0, 5);
}

/**
 * All available completion providers
 */
export const completionProviders: CompletionProvider[] = [
  commandCompletionProvider,
  domainCompletionProvider, // Add domain provider
  fileCompletionProvider,
  themeCompletionProvider,
  searchEngineCompletionProvider,
  configCompletionProvider,
  booleanCompletionProvider,
  urlCompletionProvider,
  googleSuggestionsProvider
];

export interface CompletionWithType {
  value: string;
  type: 'command' | 'domain' | 'file' | 'theme' | 'config' | 'url' | 'search' | 'other';
  provider: string;
}

/**
 * Internal helper to get completions from all applicable providers
 */
async function getCompletionsByProvider(context: CompletionContext): Promise<{ provider: CompletionProvider; completions: string[] }[]> {
  const completionsByProvider: { provider: CompletionProvider; completions: string[] }[] = [];

  // Sort providers by priority (higher first)
  const sortedProviders = [...completionProviders].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const provider of sortedProviders) {
    if (provider.canComplete(context)) {
      try {
        const completions = await provider.getCompletions(context);
        if (completions.length > 0) {
          completionsByProvider.push({provider, completions});
        }
      } catch (error) {
        console.warn(`Completion provider ${provider.name} failed:`, error);
      }
    }
  }

  return completionsByProvider;
}

/**
 * Get completions from all applicable providers with type information
 */
export async function getCompletionsFromProviders(context: CompletionContext): Promise<string[]> {
  const completionsByProvider = await getCompletionsByProvider(context);

  // Combine completions maintaining provider order
  const allCompletions: string[] = [];
  const seen = new Set<string>();

  for (const {completions} of completionsByProvider) {
    for (const completion of completions) {
      if (!seen.has(completion)) {
        seen.add(completion);
        allCompletions.push(completion);
      }
    }
  }

  return allCompletions;
}

/**
 * Get completions with type information for enhanced display
 */
export async function getCompletionsWithTypes(context: CompletionContext): Promise<CompletionWithType[]> {
  const completionsByProvider = await getCompletionsByProvider(context);

  // Combine completions with type information
  const allCompletions: CompletionWithType[] = [];
  const seen = new Set<string>();

  for (const {provider, completions} of completionsByProvider) {
    const type = getCompletionType(provider.name);
    for (const completion of completions) {
      if (!seen.has(completion)) {
        seen.add(completion);
        allCompletions.push({
          value: completion,
          type,
          provider: provider.name
        });
      }
    }
  }

  return allCompletions;
}

function getCompletionType(providerName: string): CompletionWithType['type'] {
  switch (providerName) {
    case 'commands':
      return 'command';
    case 'domains':
      return 'domain';
    case 'files':
      return 'file';
    case 'themes':
      return 'theme';
    case 'config':
      return 'config';
    case 'urls':
      return 'url';
    case 'googleSuggestions':
      return 'search';
    default:
      return 'other';
  }
}

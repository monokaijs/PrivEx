import { fileSystem } from './filesystem';
import { PathUtils } from './filesystem-types';
import { getRegisteredCommands } from '../commands/registry';
import { presetThemes } from '../themes/presets';
import { store } from '../store';
import { selectCustomThemes } from '../store/selectors';

export interface CompletionProvider {
  name: string;
  canComplete: (context: CompletionContext) => boolean;
  getCompletions: (context: CompletionContext) => Promise<string[]> | string[];
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
    
    const allThemes = { ...presetThemes, ...customThemes };
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
      const sections = ['background', 'show'];
      return sections.filter(section => 
        section.toLowerCase().startsWith(context.currentArg.toLowerCase())
      );
    } else if (context.argIndex === 1 && context.args[0] === 'background') {
      // Second argument for background config
      const properties = ['image', 'brightness'];
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
    const suggestions = commonUrls
      .filter(url => url.toLowerCase().includes(context.currentArg.toLowerCase()))
      .map(url => {
        if (context.currentArg.startsWith('http')) {
          return url.startsWith('http') ? url : `https://${url}`;
        }
        return url;
      });

    return suggestions;
  }
};

/**
 * All available completion providers
 */
export const completionProviders: CompletionProvider[] = [
  commandCompletionProvider,
  fileCompletionProvider,
  themeCompletionProvider,
  searchEngineCompletionProvider,
  configCompletionProvider,
  booleanCompletionProvider,
  urlCompletionProvider
];

/**
 * Get completions from all applicable providers
 */
export async function getCompletionsFromProviders(context: CompletionContext): Promise<string[]> {
  const allCompletions: string[] = [];

  for (const provider of completionProviders) {
    if (provider.canComplete(context)) {
      try {
        const completions = await provider.getCompletions(context);
        allCompletions.push(...completions);
      } catch (error) {
        console.warn(`Completion provider ${provider.name} failed:`, error);
      }
    }
  }

  // Remove duplicates and sort
  return Array.from(new Set(allCompletions)).sort();
}

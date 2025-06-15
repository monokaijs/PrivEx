import { getRegisteredCommands, getCommand } from '../commands/registry';
import { fileSystem } from './filesystem';
import { PathUtils } from './filesystem-types';
import { presetThemes } from '../themes/presets';
import { store } from '../store';
import { selectCustomThemes } from '../store/selectors';
import { getCompletionsFromProviders } from './autocomplete-providers';
import type { CompletionContext as ProviderContext } from './autocomplete-providers';

export interface CompletionResult {
  completions: string[];
  commonPrefix: string;
  hasMultiple: boolean;
  originalInput: string;
  cursorPosition: number;
  replaceStart: number;
  replaceEnd: number;
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

export class AutocompleteService {
  private static instance: AutocompleteService;

  private constructor() {}

  static getInstance(): AutocompleteService {
    if (!AutocompleteService.instance) {
      AutocompleteService.instance = new AutocompleteService();
    }
    return AutocompleteService.instance;
  }

  /**
   * Main autocomplete function
   */
  async getCompletions(input: string, cursorPosition: number): Promise<CompletionResult> {
    const context = this.parseContext(input, cursorPosition);

    // Use the new provider system for more comprehensive completions
    const completions = await getCompletionsFromProviders(context);

    // Filter completions based on current input
    const filtered = completions.filter(completion =>
      completion.toLowerCase().startsWith(context.currentArg.toLowerCase())
    );

    // Find common prefix
    const commonPrefix = this.findCommonPrefix(filtered);

    // Determine replacement range
    const wordStart = this.findWordStart(input, cursorPosition);
    const wordEnd = this.findWordEnd(input, cursorPosition);

    return {
      completions: filtered,
      commonPrefix,
      hasMultiple: filtered.length > 1,
      originalInput: input,
      cursorPosition,
      replaceStart: wordStart,
      replaceEnd: wordEnd
    };
  }

  /**
   * Parse the input to understand the context
   */
  private parseContext(input: string, cursorPosition: number): CompletionContext {
    const beforeCursor = input.substring(0, cursorPosition);
    const parts = beforeCursor.trim().split(/\s+/);
    
    // Handle empty input or cursor at start
    if (!beforeCursor.trim() || parts.length === 0) {
      return {
        input,
        cursorPosition,
        args: [],
        currentArg: '',
        argIndex: 0,
        isCommandPosition: true
      };
    }

    // Check if we're in the middle of typing a word
    const isInWord = cursorPosition < input.length && !/\s/.test(input[cursorPosition]);
    const isAfterSpace = beforeCursor.endsWith(' ');

    let commandName: string | undefined;
    let args: string[] = [];
    let currentArg = '';
    let argIndex = 0;
    let isCommandPosition = false;

    if (parts.length === 1 && !isAfterSpace) {
      // Still typing the command
      isCommandPosition = true;
      currentArg = parts[0];
    } else {
      // We have a command and possibly arguments
      commandName = parts[0];
      args = parts.slice(1);
      
      if (isAfterSpace) {
        // Cursor is after a space, starting a new argument
        argIndex = args.length;
        currentArg = '';
      } else {
        // Cursor is in the middle of an argument
        argIndex = args.length - 1;
        currentArg = args[argIndex] || '';
      }
    }

    return {
      input,
      cursorPosition,
      commandName,
      args,
      currentArg,
      argIndex,
      isCommandPosition
    };
  }

  /**
   * Get command name completions
   */
  private getCommandCompletions(prefix: string): string[] {
    const commands = getRegisteredCommands();
    const commandNames = new Set<string>();

    // Add primary command names
    Object.values(commands).forEach(cmd => {
      commandNames.add(cmd.name);
      // Add aliases
      cmd.aliases.forEach(alias => commandNames.add(alias));
    });

    return Array.from(commandNames).sort();
  }

  /**
   * Get argument completions based on command and argument position
   */
  private async getArgumentCompletions(context: CompletionContext): Promise<string[]> {
    const { commandName, currentArg, argIndex } = context;
    
    if (!commandName) return [];

    const command = getCommand(commandName);
    if (!command || !command.args || argIndex >= command.args.length) {
      // Try generic file/directory completion for unknown arguments
      return this.getFileCompletions(currentArg);
    }

    const argDef = command.args[argIndex];
    if (!argDef) return [];

    // Handle different argument types
    switch (argDef.type) {
      case 'file':
        return this.getFileCompletions(currentArg, 'file');
      
      case 'string':
        // Check if this is a path-like argument based on command
        if (this.isPathCommand(commandName)) {
          return this.getFileCompletions(currentArg);
        }
        return [];

      case 'theme':
        return this.getThemeCompletions(currentArg);

      default:
        // Handle enum types
        if (Array.isArray(argDef.type)) {
          return argDef.type;
        }
        
        // Handle choices
        if (argDef.choices) {
          return argDef.choices;
        }

        return [];
    }
  }

  /**
   * Get file and directory completions
   */
  private async getFileCompletions(prefix: string, type?: 'file' | 'directory'): Promise<string[]> {
    try {
      await fileSystem.initialize();
      
      // Determine the directory to search in
      let searchDir: string;
      let filePrefix: string;
      
      if (prefix.includes('/')) {
        // Path contains directory separators
        const lastSlash = prefix.lastIndexOf('/');
        const dirPart = prefix.substring(0, lastSlash + 1);
        filePrefix = prefix.substring(lastSlash + 1);
        
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
        filePrefix = prefix;
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

        // Apply type filter if specified
        if (type && item.type !== type) {
          continue;
        }

        // Format the completion
        let completion = item.name;
        
        // Add trailing slash for directories
        if (item.type === 'directory') {
          completion += '/';
        }

        // If we had a directory prefix, include it
        if (prefix.includes('/')) {
          const dirPart = prefix.substring(0, prefix.lastIndexOf('/') + 1);
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

  /**
   * Get theme name completions
   */
  private getThemeCompletions(prefix: string): string[] {
    const state = store.getState();
    const customThemes = selectCustomThemes(state);
    
    const allThemes = { ...presetThemes, ...customThemes };
    return Object.keys(allThemes).sort();
  }

  /**
   * Check if a command typically works with file paths
   */
  private isPathCommand(commandName: string): boolean {
    const pathCommands = [
      'cd', 'ls', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv',
      'head', 'tail', 'wc', 'find', 'grep', 'nano', 'less',
      'tree', 'file', 'open'
    ];
    return pathCommands.includes(commandName);
  }

  /**
   * Find the start of the current word
   */
  private findWordStart(input: string, cursorPosition: number): number {
    let start = cursorPosition;
    while (start > 0 && !/\s/.test(input[start - 1])) {
      start--;
    }
    return start;
  }

  /**
   * Find the end of the current word
   */
  private findWordEnd(input: string, cursorPosition: number): number {
    let end = cursorPosition;
    while (end < input.length && !/\s/.test(input[end])) {
      end++;
    }
    return end;
  }

  /**
   * Find the common prefix among completions
   */
  private findCommonPrefix(completions: string[]): string {
    if (completions.length === 0) return '';
    if (completions.length === 1) return completions[0];

    let prefix = completions[0];
    for (let i = 1; i < completions.length; i++) {
      while (prefix && !completions[i].toLowerCase().startsWith(prefix.toLowerCase())) {
        prefix = prefix.slice(0, -1);
      }
    }
    return prefix;
  }
}

export const autocompleteService = AutocompleteService.getInstance();

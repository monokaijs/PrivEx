export interface CommandContext<T = any> {
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  commandHistory: string[];
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  data?: T;
}

export interface HistoryEntry {
  command: string;
  output: string;
  type: 'success' | 'error' | 'info';
}

// Argument types for command definitions
export type ArgType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'url'
  | 'file'
  | 'theme'
  | 'format'
  | string[]; // enum values

export interface CommandArg {
  name: string;
  type: ArgType;
  description: string;
  required?: boolean;
  default?: any;
  choices?: string[]; // For enum-like arguments
  nested?: CommandArg[]; // For subcommands
}

export interface CommandDefinition<T = any> {
  name: string | string[];
  description: string;
  args?: CommandArg[];
  examples?: string[];
  category?: string;
  handler: (ctx: CommandContext<T>, parsedArgs: Record<string, any>) => string | void | Promise<string | void>;
}

// Legacy interface for backward compatibility
export interface Command<T = any> {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  args: CommandArg[];
  examples: string[];
  category: string;
  handler: (ctx: CommandContext<T>, parsedArgs: Record<string, any>) => string | void | Promise<string | void>;
}

export type CommandHandler<T = any> = (ctx: CommandContext<T>, parsedArgs: Record<string, any>) => string | void | Promise<string | void>;

// New declarative command definition function
export function defineCommand<T = any>(definition: CommandDefinition<T>): Command<T> {
  const names = Array.isArray(definition.name) ? definition.name : [definition.name];
  const primaryName = names[0];
  const aliases = names.slice(1);

  // Generate usage string from args
  const generateUsage = (args: CommandArg[] = []): string => {
    const argStrings = args.map(arg => {
      if (arg.nested) {
        // Handle subcommands
        const subcommands = arg.nested.map(sub => sub.name).join('|');
        return arg.required ? `<${subcommands}>` : `[${subcommands}]`;
      }

      let argStr = arg.name;
      if (arg.choices) {
        argStr = arg.choices.join('|');
      }

      return arg.required ? `<${argStr}>` : `[${argStr}]`;
    });

    return `${primaryName}${argStrings.length > 0 ? ' ' + argStrings.join(' ') : ''}`;
  };

  return {
    name: primaryName,
    aliases,
    description: definition.description,
    usage: generateUsage(definition.args),
    args: definition.args || [],
    examples: definition.examples || [],
    category: definition.category || 'general',
    handler: definition.handler
  };
}

// Legacy function for backward compatibility
export function defineCommandLegacy<T = any>(
  name: string | string[],
  description: string,
  usage: string,
  handler: (ctx: CommandContext<T>, args: string[]) => string | void | Promise<string | void>
): Command<T> {
  const names = Array.isArray(name) ? name : [name];
  const primaryName = names[0];
  const aliases = names.slice(1);

  // Wrap legacy handler to work with new system
  const wrappedHandler = (ctx: CommandContext<T>, parsedArgs: Record<string, any>) => {
    // Convert parsed args back to string array for legacy handlers
    const stringArgs = Object.values(parsedArgs).map(v => String(v)).filter(v => v !== 'undefined');
    return (handler as any)(ctx, stringArgs);
  };

  return {
    name: primaryName,
    aliases,
    description,
    usage,
    args: [],
    examples: [],
    category: 'general',
    handler: wrappedHandler
  };
}

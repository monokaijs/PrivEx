import { CommandArg, ArgType } from './types';

export interface ParseResult {
  success: boolean;
  args: Record<string, any>;
  error?: string;
}

export class ArgumentParser {
  static parse(args: string[], definition: CommandArg[]): ParseResult {
    const result: Record<string, any> = {};
    let argIndex = 0;

    for (let i = 0; i < definition.length; i++) {
      const argDef = definition[i];
      const inputValue = args[argIndex];

      if (argDef.nested) {
        if (!inputValue) {
          if (argDef.required) {
            return {
              success: false,
              args: {},
              error: `Missing required argument: ${argDef.name}`
            };
          }
          continue;
        }

        const subcommand = argDef.nested.find(sub => sub.name === inputValue);
        if (!subcommand) {
          const validOptions = argDef.nested.map(sub => sub.name).join(', ');
          return {
            success: false,
            args: {},
            error: `Invalid ${argDef.name}: ${inputValue}. Valid options: ${validOptions}`
          };
        }

        result[argDef.name] = inputValue;
        argIndex++;

        if (subcommand.nested) {
          const remainingArgs = args.slice(argIndex);
          const nestedResult = this.parse(remainingArgs, subcommand.nested);
          if (!nestedResult.success) {
            return nestedResult;
          }
          Object.assign(result, nestedResult.args);
          argIndex += Object.keys(nestedResult.args).length;
        }
        continue;
      }

      if (!inputValue) {
        if (argDef.required) {
          return {
            success: false,
            args: {},
            error: `Missing required argument: ${argDef.name}`
          };
        }
        if (argDef.default !== undefined) {
          result[argDef.name] = argDef.default;
        }
        continue;
      }

      // Validate choices
      if (argDef.choices && !argDef.choices.includes(inputValue)) {
        return {
          success: false,
          args: {},
          error: `Invalid value for ${argDef.name}: ${inputValue}. Valid options: ${argDef.choices.join(', ')}`
        };
      }

      // Type conversion and validation
      const convertedValue = this.convertType(inputValue, argDef.type);
      if (convertedValue === null) {
        return {
          success: false,
          args: {},
          error: `Invalid ${argDef.type} value for ${argDef.name}: ${inputValue}`
        };
      }

      result[argDef.name] = convertedValue;
      argIndex++;
    }

    if (argIndex < args.length) {
      if (definition.length === 1 && definition[0].type === 'string') {
        const remainingArgs = args.slice(argIndex);
        if (result[definition[0].name]) {
          result[definition[0].name] = result[definition[0].name] + ' ' + remainingArgs.join(' ');
        } else {
          result[definition[0].name] = remainingArgs.join(' ');
        }
      } else {
        const lastArg = definition[definition.length - 1];
        if (lastArg && Array.isArray(lastArg.type)) {
          const remainingArgs = args.slice(argIndex);
          if (result[lastArg.name]) {
            result[lastArg.name] = [result[lastArg.name], ...remainingArgs];
          } else {
            result[lastArg.name] = remainingArgs;
          }
        }
      }
    }

    return {
      success: true,
      args: result
    };
  }

  private static convertType(value: string, type: ArgType): any {
    if (Array.isArray(type)) {
      return type.includes(value) ? value : null;
    }

    switch (type) {
      case 'string':
        return value;
      
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      
      case 'boolean':
        const lower = value.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lower)) return true;
        if (['false', '0', 'no', 'off'].includes(lower)) return false;
        return null;
      
      case 'url':
        try {
          const urlValue = value.startsWith('http') ? value : `https://${value}`;
          new URL(urlValue);
          return urlValue;
        } catch {
          return null;
        }
      
      case 'file':
        return value.length > 0 ? value : null;
      
      case 'theme':
        return value;
      
      case 'format':
        return value;
      
      default:
        return value;
    }
  }

  static generateHelp(definition: CommandArg[], commandName: string): string {
    if (definition.length === 0) {
      return `${commandName} - No arguments required`;
    }

    const lines: string[] = [];
    lines.push(`Usage: ${commandName}`);
    
    definition.forEach(arg => {
      const required = arg.required ? 'required' : 'optional';
      const typeInfo = Array.isArray(arg.type) ? `(${arg.type.join('|')})` : `(${arg.type})`;
      const defaultInfo = arg.default !== undefined ? ` [default: ${arg.default}]` : '';
      
      lines.push(`  ${arg.name} ${typeInfo} - ${arg.description} (${required})${defaultInfo}`);
      
      if (arg.choices) {
        lines.push(`    Valid values: ${arg.choices.join(', ')}`);
      }
      
      if (arg.nested) {
        lines.push(`    Subcommands:`);
        arg.nested.forEach(sub => {
          lines.push(`      ${sub.name} - ${sub.description}`);
        });
      }
    });

    return lines.join('\n');
  }
}

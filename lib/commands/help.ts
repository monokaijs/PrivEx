import { defineCommand } from './types';
import { getRegisteredCommands } from './registry';
import { ArgumentParser } from './parser';

export const helpCommand = defineCommand({
  name: ['help', '?'],
  description: 'Show help for all commands or a specific command',
  category: 'information',
  args: [
    {
      name: 'command',
      type: 'string',
      description: 'Specific command to get help for',
      required: false
    }
  ],
  examples: [
    'help',
    'help theme',
    '? open'
  ],
  handler: (ctx, args) => {
    const commands = getRegisteredCommands();

    if (!args.command) {
      // Show all commands grouped by category
      const uniqueCommands = Array.from(new Set(Object.values(commands).map(cmd => cmd.name)))
        .map(name => commands[name])
        .filter(Boolean);

      // Group by category
      const categories: Record<string, any[]> = {};
      uniqueCommands.forEach(cmd => {
        const category = cmd.category || 'general';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(cmd);
      });

      let output = 'Available commands:\n\n';

      Object.entries(categories).forEach(([category, cmds]) => {
        output += `${category.toUpperCase()}:\n`;
        cmds.forEach(cmd => {
          const nameWithAliases = cmd.aliases.length > 0
            ? `${cmd.name} (${cmd.aliases.join(', ')})`
            : cmd.name;
          output += `  ${nameWithAliases.padEnd(18)} - ${cmd.description}\n`;
        });
        output += '\n';
      });

      output += 'Use "help <command>" for detailed information about a specific command.\n';
      return output;
    } else {
      // Show help for specific command
      const commandName = args.command.toLowerCase();
      const command = commands[commandName];

      if (!command) {
        return `Command not found: ${commandName}. Type "help" to see all available commands.`;
      }

      let output = `${command.name}: ${command.description}\n`;
      output += `Usage: ${command.usage}\n`;

      if (command.aliases.length > 0) {
        output += `Aliases: ${command.aliases.join(', ')}\n`;
      }

      if (command.args.length > 0) {
        output += '\n' + ArgumentParser.generateHelp(command.args, command.name);
      }

      if (command.examples.length > 0) {
        output += '\n\nExamples:\n';
        command.examples.forEach(example => {
          output += `  ${example}\n`;
        });
      }

      return output;
    }
  }
});

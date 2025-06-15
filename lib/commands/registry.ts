import {Command} from './types';
import {ArgumentParser} from './parser';
import {helpCommand} from './help';
import {aboutCommand} from './about';
import {openCommand} from './open';
import {clearCommand} from './clear';
import {echoCommand} from './echo';
import {historyCommand} from './history';
import {timeCommand} from './time';
import {themeCommand} from './theme';
import {terminalPopupCommand} from './terminal-popup';
import {editorCommand} from './editor';

import {
  pwdCommand,
  cdCommand,
  lsCommand,
  mkdirCommand,
  touchCommand,
  catCommand,
  rmCommand,
  cpCommand,
  mvCommand,
  dfCommand
} from './filesystem';

import {
  echoFsCommand,
  headCommand,
  tailCommand,
  wcCommand,
  findCommand
} from './echo-fs';

import {
  fileManagerCommand,
  treeCommand,
  fileCommand,
  duCommand
} from './file-manager';

import {
  fileOpenCommand,
  nanoCommand,
  lessCommand,
  grepCommand
} from './open-file';

import {
  searchCommand,
  searchConfigCommand,
  youtubeCommand,
  stackoverflowCommand
} from './search';

import { configCommand } from './config';
import { autocompleteCommand } from './autocomplete';
import { domainsCommand } from './domains';

const commands: Record<string, Command> = {};

export function registerCommand(command: Command): void {
  commands[command.name.toLowerCase()] = command;

  command.aliases.forEach(alias => {
    commands[alias.toLowerCase()] = command;
  });
}

export function getRegisteredCommands(): Record<string, Command> {
  return {...commands};
}

export function getCommand(name: string): Command | undefined {
  return commands[name.toLowerCase()];
}

export async function executeCommand(
  commandName: string,
  args: string[],
  ctx: any
): Promise<{ output?: string; type: 'success' | 'error' | 'info' }> {
  const command = getCommand(commandName);

  if (!command) {
    return {
      output: `Command not found: ${commandName}. Type "help" for available commands.`,
      type: 'error'
    };
  }

  try {
    const parseResult = ArgumentParser.parse(args, command.args);

    if (!parseResult.success) {
      return {
        output: `${parseResult.error}\n\n${ArgumentParser.generateHelp(command.args, command.name)}`,
        type: 'error'
      };
    }

    const result = await command.handler(ctx, parseResult.args);

    if (result === undefined || result === null) {
      return {type: 'success'};
    }

    return {
      output: result,
      type: 'success'
    };
  } catch (error) {
    return {
      output: `Error executing command: ${error}`,
      type: 'error'
    };
  }
}

export function initializeCommands(): void {
  registerCommand(helpCommand);
  registerCommand(aboutCommand);
  registerCommand(openCommand);
  registerCommand(clearCommand);
  registerCommand(historyCommand);
  registerCommand(timeCommand);
  registerCommand(themeCommand);
  registerCommand(terminalPopupCommand);
  registerCommand(editorCommand);

  // File system commands
  registerCommand(pwdCommand);
  registerCommand(cdCommand);
  registerCommand(lsCommand);
  registerCommand(mkdirCommand);
  registerCommand(touchCommand);
  registerCommand(catCommand);
  registerCommand(rmCommand);
  registerCommand(cpCommand);
  registerCommand(mvCommand);
  registerCommand(dfCommand);

  // Enhanced file commands
  registerCommand(echoFsCommand); // This replaces the basic echo command
  registerCommand(headCommand);
  registerCommand(tailCommand);
  registerCommand(wcCommand);
  registerCommand(findCommand);

  // File manager utilities
  registerCommand(fileManagerCommand);
  registerCommand(treeCommand);
  registerCommand(fileCommand);
  registerCommand(duCommand);

  // File operations
  registerCommand(fileOpenCommand);
  registerCommand(nanoCommand);
  registerCommand(lessCommand);
  registerCommand(grepCommand);

  // Search commands
  registerCommand(searchCommand);
  registerCommand(searchConfigCommand);

  // Popular search shortcuts
  registerCommand(youtubeCommand);
  registerCommand(stackoverflowCommand);

  registerCommand(configCommand);
  registerCommand(autocompleteCommand);
  registerCommand(domainsCommand);
}

initializeCommands();

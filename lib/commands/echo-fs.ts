import {defineCommand} from './types';
import {fileSystem} from '../services/filesystem';

export const echoFsCommand = defineCommand({
  name: ['echo'],
  description: 'Display text or write to files with redirection',
  category: 'filesystem',
  args: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to display or write',
      required: true
    }
  ],
  examples: [
    'echo "Hello World"',
    'echo "Hello" > file.txt',
    'echo "More text" >> file.txt',
    'echo $USER',
    'echo "Current time: $(date)"'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();

      const originalInput = ctx.input || '';
      const redirectMatch = originalInput.match(/^echo\s+(.+?)\s*(>>?)\s*(.+)$/);

      if (redirectMatch) {
        const [, content, operator, filename] = redirectMatch;

        let cleanContent = content.trim();
        if ((cleanContent.startsWith('"') && cleanContent.endsWith('"')) ||
          (cleanContent.startsWith("'") && cleanContent.endsWith("'"))) {
          cleanContent = cleanContent.slice(1, -1);
        }

        cleanContent = cleanContent.replace(/\$(\w+)/g, (match, varName) => {
          switch (varName) {
            case 'USER':
              return 'user';
            case 'HOME':
              return '/home/user';
            case 'PWD':
              return fileSystem.getCurrentDirectory();
            default:
              return match;
          }
        });

        cleanContent = cleanContent.replace(/\$\(([^)]+)\)/g, (match, command) => {
          switch (command.trim()) {
            case 'date':
              return new Date().toLocaleString();
            case 'pwd':
              return fileSystem.getCurrentDirectory();
            default:
              return match;
          }
        });

        const cleanFilename = filename.trim();
        const append = operator === '>>';

        try {
          if (append) {
            await fileSystem.writeFile(cleanFilename, cleanContent + '\n', true);
          } else {
            await fileSystem.writeFile(cleanFilename, cleanContent + '\n', false);
          }

          return `Text written to: ${cleanFilename}`;
        } catch (error) {
          return `echo: cannot write to '${cleanFilename}': ${error}`;
        }
      } else {
        let text = args.text;

        text = text.replace(/\$(\w+)/g, (match: string, varName: string) => {
          switch (varName) {
            case 'USER':
              return 'user';
            case 'HOME':
              return '/home/user';
            case 'PWD':
              return fileSystem.getCurrentDirectory();
            default:
              return match;
          }
        });

        text = text.replace(/\$\(([^)]+)\)/g, (match: string, command: string) => {
          switch (command.trim()) {
            case 'date':
              return new Date().toLocaleString();
            case 'pwd':
              return fileSystem.getCurrentDirectory();
            default:
              return match;
          }
        });

        if ((text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"))) {
          text = text.slice(1, -1);
        }

        return text;
      }
    } catch (error) {
      return `echo: ${error}`;
    }
  }
});

export const headCommand = defineCommand({
  name: ['head'],
  description: 'Display the first lines of a file',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to display',
      required: true
    },
    {
      name: 'lines',
      type: 'number',
      description: 'Number of lines to display (-n)',
      required: false,
      default: 10
    }
  ],
  examples: [
    'head file.txt',
    'head -n 5 log.txt',
    'head -n 20 document.md'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      const content = await fileSystem.readFile(args.path);

      if (!content) {
        return '(empty file)';
      }

      const lines = content.split('\n');
      const displayLines = lines.slice(0, args.lines);

      return displayLines.join('\n');
    } catch (error) {
      return `head: ${error}`;
    }
  }
});

export const tailCommand = defineCommand({
  name: ['tail'],
  description: 'Display the last lines of a file',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to display',
      required: true
    },
    {
      name: 'lines',
      type: 'number',
      description: 'Number of lines to display (-n)',
      required: false,
      default: 10
    }
  ],
  examples: [
    'tail file.txt',
    'tail -n 5 log.txt',
    'tail -n 20 document.md'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      const content = await fileSystem.readFile(args.path);

      if (!content) {
        return '(empty file)';
      }

      const lines = content.split('\n');
      const displayLines = lines.slice(-args.lines);

      return displayLines.join('\n');
    } catch (error) {
      return `tail: ${error}`;
    }
  }
});

export const wcCommand = defineCommand({
  name: ['wc'],
  description: 'Print newline, word, and byte counts for files',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to analyze',
      required: true
    },
    {
      name: 'lines',
      type: 'boolean',
      description: 'Print line count only (-l)',
      required: false,
      default: false
    },
    {
      name: 'words',
      type: 'boolean',
      description: 'Print word count only (-w)',
      required: false,
      default: false
    },
    {
      name: 'chars',
      type: 'boolean',
      description: 'Print character count only (-c)',
      required: false,
      default: false
    }
  ],
  examples: [
    'wc file.txt',
    'wc -l document.md',
    'wc -w essay.txt',
    'wc -c data.json'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      const content = await fileSystem.readFile(args.path);

      const lines = content.split('\n').length - (content.endsWith('\n') ? 1 : 0);
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      const chars = content.length;

      if (args.lines) {
        return `${lines}`;
      } else if (args.words) {
        return `${words}`;
      } else if (args.chars) {
        return `${chars}`;
      } else {
        return `${lines} ${words} ${chars} ${args.path}`;
      }
    } catch (error) {
      return `wc: ${error}`;
    }
  }
});

export const findCommand = defineCommand({
  name: ['find'],
  description: 'Search for files and directories',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Starting directory for search',
      required: false,
      default: '.'
    },
    {
      name: 'name',
      type: 'string',
      description: 'Search by name pattern (-name)',
      required: false
    },
    {
      name: 'type',
      type: ['f', 'd'],
      description: 'Search by type: f=file, d=directory (-type)',
      required: false
    }
  ],
  examples: [
    'find',
    'find /home -name "*.txt"',
    'find . -type f',
    'find /tmp -type d'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();

      const searchPath = args.path || '.';
      const results: string[] = [];

      // Simple recursive search function
      const search = async (currentPath: string) => {
        try {
          const items = await fileSystem.listDirectory(currentPath, {showHidden: true});

          for (const item of items) {
            const fullPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;

            if (args.type) {
              if (args.type === 'f' && item.type !== 'file') continue;
              if (args.type === 'd' && item.type !== 'directory') continue;
            }

            if (args.name) {
              const pattern = args.name.replace(/\*/g, '.*').replace(/\?/g, '.');
              const regex = new RegExp(`^${pattern}$`, 'i');
              if (!regex.test(item.name)) continue;
            }

            results.push(fullPath);

            if (item.type === 'directory') {
              await search(fullPath);
            }
          }
        } catch (error) {
        }
      };

      await search(searchPath);

      if (results.length === 0) {
        return 'No files found matching criteria';
      }

      return results.join('\n');
    } catch (error) {
      return `find: ${error}`;
    }
  }
});

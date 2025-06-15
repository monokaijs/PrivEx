import { defineCommand } from './types';
import { fileSystem } from '../services/filesystem';
import { PathUtils } from '../services/filesystem-types';

/**
 * pwd - Print working directory
 */
export const pwdCommand = defineCommand({
  name: ['pwd'],
  description: 'Print the current working directory',
  category: 'filesystem',
  examples: ['pwd'],
  handler: async () => {
    try {
      await fileSystem.initialize();
      return fileSystem.getCurrentDirectory();
    } catch (error) {
      return `Error: ${error}`;
    }
  }
});

/**
 * cd - Change directory
 */
export const cdCommand = defineCommand({
  name: ['cd'],
  description: 'Change the current directory',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to change to',
      required: false,
      default: '/home/user'
    }
  ],
  examples: [
    'cd',
    'cd ..',
    'cd /home',
    'cd documents'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      const path = args.path || '/home/user';
      await fileSystem.changeDirectory(path);
      return `Changed directory to: ${fileSystem.getCurrentDirectory()}`;
    } catch (error) {
      return `cd: ${error}`;
    }
  }
});

/**
 * ls - List directory contents
 */
export const lsCommand = defineCommand({
  name: ['ls', 'dir'],
  description: 'List directory contents',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to list',
      required: false
    },
    {
      name: 'long',
      type: 'boolean',
      description: 'Use long listing format (-l)',
      required: false,
      default: false
    },
    {
      name: 'all',
      type: 'boolean',
      description: 'Show hidden files (-a)',
      required: false,
      default: false
    }
  ],
  examples: [
    'ls',
    'ls /home',
    'ls -l',
    'ls -a',
    'ls -la documents'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const items = await fileSystem.listDirectory(args.path, {
        longFormat: args.long,
        showHidden: args.all,
        sortBy: 'name'
      });
      
      if (items.length === 0) {
        return 'Directory is empty';
      }
      
      if (args.long) {
        // Long format: permissions size date name
        const lines = items.map(item => {
          const type = item.type === 'directory' ? 'd' : '-';
          const perms = item.permissions || 'rwxr-xr-x';
          const size = item.size.toString().padStart(8);
          const date = new Date(item.modifiedAt).toLocaleDateString();
          const name = item.type === 'directory' ? `${item.name}/` : item.name;
          
          return `${type}${perms} ${size} ${date} ${name}`;
        });
        
        return lines.join('\n');
      } else {
        // Simple format: just names
        const names = items.map(item => 
          item.type === 'directory' ? `${item.name}/` : item.name
        );
        
        // Display in columns (4 per row)
        const columns = 4;
        const rows: string[] = [];
        for (let i = 0; i < names.length; i += columns) {
          const row = names.slice(i, i + columns);
          rows.push(row.map(name => name.padEnd(20)).join(''));
        }
        
        return rows.join('\n');
      }
    } catch (error) {
      return `ls: ${error}`;
    }
  }
});

/**
 * mkdir - Create directory
 */
export const mkdirCommand = defineCommand({
  name: ['mkdir'],
  description: 'Create directories',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to create',
      required: true
    },
    {
      name: 'parents',
      type: 'boolean',
      description: 'Create parent directories as needed (-p)',
      required: false,
      default: false
    }
  ],
  examples: [
    'mkdir documents',
    'mkdir -p projects/web/app',
    'mkdir /tmp/test'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      await fileSystem.createDirectory(args.path, args.parents);
      return `Directory created: ${args.path}`;
    } catch (error) {
      return `mkdir: ${error}`;
    }
  }
});

/**
 * touch - Create empty file
 */
export const touchCommand = defineCommand({
  name: ['touch'],
  description: 'Create empty files or update timestamps',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to create or touch',
      required: true
    }
  ],
  examples: [
    'touch file.txt',
    'touch documents/readme.md',
    'touch /tmp/temp.log'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const exists = await fileSystem.exists(args.path);
      if (exists) {
        // Update timestamp by reading and writing the same content
        const content = await fileSystem.readFile(args.path);
        await fileSystem.writeFile(args.path, content);
        return `Updated timestamp: ${args.path}`;
      } else {
        await fileSystem.createFile(args.path, '');
        return `File created: ${args.path}`;
      }
    } catch (error) {
      return `touch: ${error}`;
    }
  }
});

/**
 * cat - Display file contents
 */
export const catCommand = defineCommand({
  name: ['cat', 'type'],
  description: 'Display file contents',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to display',
      required: true
    }
  ],
  examples: [
    'cat file.txt',
    'cat documents/readme.md',
    'type config.json'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      const content = await fileSystem.readFile(args.path);
      return content || '(empty file)';
    } catch (error) {
      return `cat: ${error}`;
    }
  }
});

/**
 * rm - Remove files and directories
 */
export const rmCommand = defineCommand({
  name: ['rm', 'del'],
  description: 'Remove files and directories',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File or directory path to remove',
      required: true
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Remove directories recursively (-r)',
      required: false,
      default: false
    },
    {
      name: 'force',
      type: 'boolean',
      description: 'Force removal without confirmation (-f)',
      required: false,
      default: false
    }
  ],
  examples: [
    'rm file.txt',
    'rm -r documents',
    'rm -rf /tmp/cache',
    'del old_file.log'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const stat = await fileSystem.stat(args.path);
      
      if (stat.type === 'directory' && !args.recursive) {
        return `rm: cannot remove '${args.path}': Is a directory (use -r for recursive)`;
      }
      
      await fileSystem.delete(args.path, args.recursive);
      return `Removed: ${args.path}`;
    } catch (error) {
      return `rm: ${error}`;
    }
  }
});

/**
 * cp - Copy files and directories
 */
export const cpCommand = defineCommand({
  name: ['cp', 'copy'],
  description: 'Copy files and directories',
  category: 'filesystem',
  args: [
    {
      name: 'source',
      type: 'string',
      description: 'Source path',
      required: true
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Destination path',
      required: true
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Copy directories recursively (-r)',
      required: false,
      default: false
    }
  ],
  examples: [
    'cp file.txt backup.txt',
    'cp -r documents backup_docs',
    'copy source.js target.js'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      await fileSystem.copy(args.source, args.destination, {
        recursive: args.recursive,
        force: false
      });
      return `Copied: ${args.source} -> ${args.destination}`;
    } catch (error) {
      return `cp: ${error}`;
    }
  }
});

/**
 * mv - Move/rename files and directories
 */
export const mvCommand = defineCommand({
  name: ['mv', 'move', 'ren'],
  description: 'Move or rename files and directories',
  category: 'filesystem',
  args: [
    {
      name: 'source',
      type: 'string',
      description: 'Source path',
      required: true
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Destination path',
      required: true
    }
  ],
  examples: [
    'mv old_name.txt new_name.txt',
    'mv documents archive',
    'move file.txt /tmp/',
    'ren oldfile newfile'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      await fileSystem.move(args.source, args.destination);
      return `Moved: ${args.source} -> ${args.destination}`;
    } catch (error) {
      return `mv: ${error}`;
    }
  }
});

/**
 * df - Display file system statistics
 */
export const dfCommand = defineCommand({
  name: ['df'],
  description: 'Display file system disk space usage',
  category: 'filesystem',
  examples: ['df'],
  handler: async () => {
    try {
      await fileSystem.initialize();
      const stats = await fileSystem.getStats();
      
      const usedMB = (stats.storageUsed / (1024 * 1024)).toFixed(2);
      const limitMB = (stats.storageLimit / (1024 * 1024)).toFixed(2);
      const usedPercent = ((stats.storageUsed / stats.storageLimit) * 100).toFixed(1);
      
      return `File System Usage:
Files: ${stats.totalFiles}
Directories: ${stats.totalDirectories}
Storage Used: ${usedMB} MB / ${limitMB} MB (${usedPercent}%)
Available: ${(parseFloat(limitMB) - parseFloat(usedMB)).toFixed(2)} MB`;
    } catch (error) {
      return `df: ${error}`;
    }
  }
});

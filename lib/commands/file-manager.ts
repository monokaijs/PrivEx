import { defineCommand } from './types';
import { fileSystem } from '../services/filesystem';

/**
 * file-manager - Display file system overview and help
 */
export const fileManagerCommand = defineCommand({
  name: ['file-manager', 'fm', 'files'],
  description: 'Display file system overview and available commands',
  category: 'filesystem',
  examples: [
    'file-manager',
    'fm',
    'files'
  ],
  handler: async () => {
    try {
      await fileSystem.initialize();
      
      const stats = await fileSystem.getStats();
      const currentDir = fileSystem.getCurrentDirectory();
      
      const usedMB = (stats.storageUsed / (1024 * 1024)).toFixed(2);
      const limitMB = (stats.storageLimit / (1024 * 1024)).toFixed(2);
      const usedPercent = ((stats.storageUsed / stats.storageLimit) * 100).toFixed(1);
      
      return `📁 Virtual File System Manager

Current Directory: ${currentDir}
Files: ${stats.totalFiles} | Directories: ${stats.totalDirectories}
Storage: ${usedMB}MB / ${limitMB}MB (${usedPercent}% used)

📋 Available Commands:

Navigation:
  pwd                    Show current directory
  cd <path>              Change directory
  ls [path] [-l] [-a]    List directory contents
  
File Operations:
  touch <file>           Create empty file
  cat <file>             Display file contents
  echo "text" > file     Write text to file
  echo "text" >> file    Append text to file
  
Directory Operations:
  mkdir <dir> [-p]       Create directory
  rmdir <dir>            Remove empty directory
  
Copy/Move/Delete:
  cp <src> <dest> [-r]   Copy files/directories
  mv <src> <dest>        Move/rename files/directories
  rm <path> [-r] [-f]    Remove files/directories
  
File Information:
  head <file> [-n N]     Show first N lines
  tail <file> [-n N]     Show last N lines
  wc <file> [-l|-w|-c]   Count lines/words/characters
  find [path] [-name pattern] [-type f|d]  Search files
  
System:
  df                     Show disk usage
  file-manager           Show this help

💡 Tips:
- Use tab completion for file paths
- Paths can be absolute (/home/user/file.txt) or relative (../file.txt)
- Use quotes for filenames with spaces: "my file.txt"
- The file system persists across browser sessions
- Maximum file size: 1MB, Total storage: 10MB

Try: ls -la to see all files in long format!`;
    } catch (error) {
      return `file-manager: ${error}`;
    }
  }
});

/**
 * tree - Display directory structure as a tree
 */
export const treeCommand = defineCommand({
  name: ['tree'],
  description: 'Display directory structure as a tree',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to display',
      required: false,
      default: '.'
    },
    {
      name: 'depth',
      type: 'number',
      description: 'Maximum depth to display (-L)',
      required: false,
      default: 3
    }
  ],
  examples: [
    'tree',
    'tree /home',
    'tree -L 2',
    'tree /tmp -L 1'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const startPath = args.path || '.';
      const maxDepth = args.depth || 3;
      const result: string[] = [];
      
      // Resolve the starting path
      const resolvedPath = startPath === '.' ? fileSystem.getCurrentDirectory() : startPath;
      
      // Check if path exists
      const exists = await fileSystem.exists(resolvedPath);
      if (!exists) {
        return `tree: ${startPath}: No such file or directory`;
      }
      
      const stat = await fileSystem.stat(resolvedPath);
      if (stat.type !== 'directory') {
        return `tree: ${startPath}: Not a directory`;
      }
      
      result.push(resolvedPath);
      
      // Recursive tree building function
      const buildTree = async (currentPath: string, prefix: string, depth: number) => {
        if (depth >= maxDepth) return;
        
        try {
          const items = await fileSystem.listDirectory(currentPath, { 
            sortBy: 'name',
            showHidden: false 
          });
          
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isLast = i === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const itemName = item.type === 'directory' ? `${item.name}/` : item.name;
            
            result.push(`${prefix}${connector}${itemName}`);
            
            if (item.type === 'directory') {
              const newPrefix = prefix + (isLast ? '    ' : '│   ');
              const childPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
              await buildTree(childPath, newPrefix, depth + 1);
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      };
      
      await buildTree(resolvedPath, '', 0);
      
      // Add summary
      const stats = await fileSystem.getStats();
      result.push('');
      result.push(`${stats.totalDirectories} directories, ${stats.totalFiles} files`);
      
      return result.join('\n');
    } catch (error) {
      return `tree: ${error}`;
    }
  }
});

/**
 * file - Determine file type
 */
export const fileCommand = defineCommand({
  name: ['file'],
  description: 'Determine file type',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to analyze',
      required: true
    }
  ],
  examples: [
    'file document.txt',
    'file script.js',
    'file /home/user'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const stat = await fileSystem.stat(args.path);
      
      if (stat.type === 'directory') {
        return `${args.path}: directory`;
      }
      
      const extension = stat.extension?.toLowerCase() || '';
      let fileType = 'data';

      if (['.txt', '.md', '.readme', '.log', '.conf', '.config', '.ini', '.env'].includes(extension)) {
        fileType = 'text';
      }
      else if (['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.py', '.java', '.c', '.cpp', '.h'].includes(extension)) {
        fileType = 'source code';
      }
      else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(extension)) {
        fileType = 'image';
      }
      // Archive files
      else if (['.zip', '.tar', '.gz', '.rar'].includes(extension)) {
        fileType = 'archive';
      }
      // Document files
      else if (['.pdf', '.doc', '.docx', '.rtf'].includes(extension)) {
        fileType = 'document';
      }
      
      // Try to detect based on content for files without extension
      if (!extension && stat.size > 0) {
        try {
          const content = await fileSystem.readFile(args.path);
          const firstLine = content.split('\n')[0].toLowerCase();
          
          if (firstLine.includes('<!doctype') || firstLine.includes('<html')) {
            fileType = 'HTML document';
          } else if (content.startsWith('{') || content.startsWith('[')) {
            fileType = 'JSON data';
          } else if (firstLine.includes('#!/')) {
            fileType = 'script';
          } else if (/^[a-zA-Z0-9\s\.,!?;:'"()-]+$/.test(content.substring(0, 100))) {
            fileType = 'text';
          }
        } catch (error) {
          // Can't read content, stick with 'data'
        }
      }
      
      const sizeStr = stat.size === 0 ? 'empty' : `${stat.size} bytes`;
      return `${args.path}: ${fileType} (${sizeStr})`;
    } catch (error) {
      return `file: ${error}`;
    }
  }
});

/**
 * du - Display directory usage
 */
export const duCommand = defineCommand({
  name: ['du'],
  description: 'Display directory disk usage',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to analyze',
      required: false,
      default: '.'
    },
    {
      name: 'human',
      type: 'boolean',
      description: 'Human readable format (-h)',
      required: false,
      default: false
    }
  ],
  examples: [
    'du',
    'du /home',
    'du -h documents'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const targetPath = args.path || '.';
      const results: string[] = [];
      
      // Calculate directory sizes recursively
      const calculateSize = async (path: string): Promise<number> => {
        const stat = await fileSystem.stat(path);
        
        if (stat.type === 'file') {
          return stat.size;
        }
        
        let totalSize = 0;
        const items = await fileSystem.listDirectory(path, { showHidden: true });
        
        for (const item of items) {
          const childPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
          totalSize += await calculateSize(childPath);
        }
        
        return totalSize;
      };
      
      const formatSize = (bytes: number): string => {
        if (!args.human) {
          return bytes.toString();
        }
        
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
      };
      
      const totalSize = await calculateSize(targetPath);
      const formattedSize = formatSize(totalSize);
      
      return `${formattedSize}\t${targetPath}`;
    } catch (error) {
      return `du: ${error}`;
    }
  }
});

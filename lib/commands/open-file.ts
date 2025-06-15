import { defineCommand } from './types';
import { fileSystem } from '../services/filesystem';
import { PathUtils } from '../services/filesystem-types';

export const fileOpenCommand = defineCommand({
  name: ['file-open', 'fopen'],
  description: 'Open files in the editor or show directory contents',
  category: 'filesystem',
  args: [
    {
      name: 'path',
      type: 'string',
      description: 'File or directory path to open',
      required: true
    },
    {
      name: 'language',
      type: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'text'],
      description: 'Force specific language for syntax highlighting',
      required: false
    }
  ],
  examples: [
    'file-open file.txt',
    'fopen script.js',
    'file-open document.md markdown',
    'fopen /home/user/config.json',
    'file-open .'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const path = args.path;
      const exists = await fileSystem.exists(path);
      
      if (!exists) {
        return `open: ${path}: No such file or directory`;
      }
      
      const stat = await fileSystem.stat(path);
      
      if (stat.type === 'directory') {
        // Open directory - show contents
        try {
          const items = await fileSystem.listDirectory(path, {
            longFormat: true,
            showHidden: false,
            sortBy: 'name'
          });
          
          if (items.length === 0) {
            return `Directory ${path} is empty`;
          }
          
          const lines = [`Contents of ${path}:`];
          lines.push('');
          
          items.forEach(item => {
            const type = item.type === 'directory' ? 'd' : '-';
            const perms = item.permissions || 'rwxr-xr-x';
            const size = item.size.toString().padStart(8);
            const date = new Date(item.modifiedAt).toLocaleDateString();
            const name = item.type === 'directory' ? `${item.name}/` : item.name;
            
            lines.push(`${type}${perms} ${size} ${date} ${name}`);
          });
          
          return lines.join('\n');
        } catch (error) {
          return `open: cannot read directory ${path}: ${error}`;
        }
      } else {
        // Open file in editor
        try {
          const content = await fileSystem.readFile(path);
          
          // Auto-detect language from file extension if not specified
          let language = args.language;
          if (!language) {
            const extension = PathUtils.extname(path).toLowerCase();
            language = detectLanguageFromExtension(extension);
          }
          
          // Trigger code editor popup creation through global event
          const event = new CustomEvent('openCodeEditor', {
            detail: {
              filename: path,
              language,
              content,
              isNewFile: false,
              useFileSystem: true
            }
          });
          window.dispatchEvent(event);
          
          return `Opened ${path} in editor`;
        } catch (error) {
          return `open: cannot read file ${path}: ${error}`;
        }
      }
    } catch (error) {
      return `open: ${error}`;
    }
  }
});

/**
 * Detect programming language from file extension
 */
function detectLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'css',
    '.sass': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.txt': 'text',
    '.log': 'text',
    '.conf': 'text',
    '.config': 'text',
    '.ini': 'text',
    '.env': 'text',
    '.xml': 'html',
    '.yaml': 'text',
    '.yml': 'text'
  };
  
  return languageMap[extension] || 'text';
}

/**
 * nano - Simple text editor command (alias for editor)
 */
export const nanoCommand = defineCommand({
  name: ['nano', 'vim', 'vi'],
  description: 'Open a file in the text editor',
  category: 'filesystem',
  args: [
    {
      name: 'filename',
      type: 'string',
      description: 'File to edit',
      required: true
    }
  ],
  examples: [
    'nano file.txt',
    'vim script.js',
    'vi config.conf'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const filename = args.filename;
      let content = '';
      let isNewFile = false;
      
      // Try to load existing file
      try {
        const exists = await fileSystem.exists(filename);
        if (exists) {
          const stat = await fileSystem.stat(filename);
          if (stat.type === 'file') {
            content = await fileSystem.readFile(filename);
          } else {
            return `nano: ${filename}: Is a directory`;
          }
        } else {
          isNewFile = true;
        }
      } catch (error) {
        isNewFile = true;
      }
      
      // Auto-detect language
      const extension = PathUtils.extname(filename).toLowerCase();
      const language = detectLanguageFromExtension(extension);
      
      // Trigger code editor popup creation through global event
      const event = new CustomEvent('openCodeEditor', {
        detail: {
          filename,
          language,
          content,
          isNewFile,
          useFileSystem: true
        }
      });
      window.dispatchEvent(event);
      
      // Silent execution - no return value
      return;
    } catch (error) {
      return `nano: ${error}`;
    }
  }
});

/**
 * less - View file contents with pagination (simplified version)
 */
export const lessCommand = defineCommand({
  name: ['less', 'more'],
  description: 'View file contents',
  category: 'filesystem',
  args: [
    {
      name: 'filename',
      type: 'string',
      description: 'File to view',
      required: true
    },
    {
      name: 'lines',
      type: 'number',
      description: 'Number of lines to display',
      required: false,
      default: 20
    }
  ],
  examples: [
    'less file.txt',
    'more document.md',
    'less -n 10 log.txt'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const content = await fileSystem.readFile(args.filename);
      
      if (!content) {
        return '(empty file)';
      }
      
      const lines = content.split('\n');
      const maxLines = args.lines || 20;
      
      if (lines.length <= maxLines) {
        return content;
      }
      
      const displayLines = lines.slice(0, maxLines);
      const remaining = lines.length - maxLines;
      
      return displayLines.join('\n') + 
             `\n\n--- ${remaining} more lines (use 'cat ${args.filename}' to see all) ---`;
    } catch (error) {
      return `less: ${error}`;
    }
  }
});

/**
 * grep - Search for patterns in files
 */
export const grepCommand = defineCommand({
  name: ['grep'],
  description: 'Search for patterns in files',
  category: 'filesystem',
  args: [
    {
      name: 'pattern',
      type: 'string',
      description: 'Pattern to search for',
      required: true
    },
    {
      name: 'filename',
      type: 'string',
      description: 'File to search in',
      required: true
    },
    {
      name: 'ignoreCase',
      type: 'boolean',
      description: 'Ignore case (-i)',
      required: false,
      default: false
    },
    {
      name: 'lineNumbers',
      type: 'boolean',
      description: 'Show line numbers (-n)',
      required: false,
      default: false
    }
  ],
  examples: [
    'grep "hello" file.txt',
    'grep -i "error" log.txt',
    'grep -n "function" script.js',
    'grep -in "todo" notes.md'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();
      
      const content = await fileSystem.readFile(args.filename);
      
      if (!content) {
        return `grep: ${args.filename}: empty file`;
      }
      
      const lines = content.split('\n');
      const pattern = args.ignoreCase ? 
        new RegExp(args.pattern, 'i') : 
        new RegExp(args.pattern);
      
      const matches: string[] = [];
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          const lineNumber = index + 1;
          const prefix = args.lineNumbers ? `${lineNumber}:` : '';
          matches.push(`${prefix}${line}`);
        }
      });
      
      if (matches.length === 0) {
        return `grep: no matches found for "${args.pattern}" in ${args.filename}`;
      }
      
      return matches.join('\n');
    } catch (error) {
      return `grep: ${error}`;
    }
  }
});

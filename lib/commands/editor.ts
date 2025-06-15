import { defineCommand } from './types';
import { fileSystem } from '../services/filesystem';
import { PathUtils } from '../services/filesystem-types';

export const editorCommand = defineCommand({
  name: ['editor', 'edit', 'code'],
  description: 'Open a code editor with syntax highlighting and file system integration',
  category: 'tools',
  args: [
    {
      name: 'filename',
      type: 'string',
      description: 'Name of the file to edit (optional)',
      required: false,
      default: 'untitled.txt'
    },
    {
      name: 'language',
      type: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'text'],
      description: 'Programming language for syntax highlighting',
      required: false
    },
    {
      name: 'new',
      type: 'boolean',
      description: 'Create a new file even if it exists (-n)',
      required: false,
      default: false
    }
  ],
  examples: [
    'editor',
    'editor script.js',
    'editor index.html html',
    'edit main.py python',
    'code styles.css css',
    'editor -n newfile.txt'
  ],
  handler: async (ctx, args) => {
    try {
      await fileSystem.initialize();

      const filename = args.filename || 'untitled.txt';
      let content = '';
      let language = args.language;
      let isNewFile = args.new;

      if (!language) {
        const extension = PathUtils.extname(filename).toLowerCase();
        language = detectLanguageFromExtension(extension);
      }

      if (!isNewFile) {
        try {
          const exists = await fileSystem.exists(filename);
          if (exists) {
            const stat = await fileSystem.stat(filename);
            if (stat.type === 'file') {
              content = await fileSystem.readFile(filename);
            } else {
              return `editor: ${filename}: Is a directory`;
            }
          } else {
            isNewFile = true;
          }
        } catch (error) {
          isNewFile = true;
        }
      }

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

      return;
    } catch (error) {
      return `editor: ${error}`;
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

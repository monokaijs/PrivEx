export type FileType = 'file' | 'directory';

export interface FileMetadata {
  name: string;
  type: FileType;
  size: number;
  createdAt: number;
  modifiedAt: number;
  permissions: string; // e.g., 'rwxr-xr-x'
  extension?: string;
}

export interface FileNode extends FileMetadata {
  path: string;
  parent?: string;
  children?: string[]; // For directories, array of child paths
  contentId?: string; // For files, reference to content storage
}

export interface FileContent {
  id: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

export interface FileSystemState {
  nodes: Record<string, FileNode>; // path -> node mapping
  currentWorkingDirectory: string;
  rootPath: string;
}

export interface FileSystemStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  storageUsed: number;
  storageLimit: number;
}

export interface PathInfo {
  isAbsolute: boolean;
  segments: string[];
  normalized: string;
  parent: string;
  basename: string;
  extension: string;
}

export interface ListingOptions {
  showHidden?: boolean;
  longFormat?: boolean;
  recursive?: boolean;
  sortBy?: 'name' | 'size' | 'date' | 'type';
  reverse?: boolean;
}

export interface CopyOptions {
  recursive?: boolean;
  force?: boolean;
  preserveTimestamps?: boolean;
}

export interface FileSystemError extends Error {
  code: string;
  path?: string;
  errno?: number;
}

// Common file system error codes
export const FS_ERRORS = {
  ENOENT: 'ENOENT', // No such file or directory
  EEXIST: 'EEXIST', // File exists
  ENOTDIR: 'ENOTDIR', // Not a directory
  EISDIR: 'EISDIR', // Is a directory
  ENOTEMPTY: 'ENOTEMPTY', // Directory not empty
  EPERM: 'EPERM', // Operation not permitted
  ENOSPC: 'ENOSPC', // No space left on device
  EINVAL: 'EINVAL', // Invalid argument
} as const;

// Storage keys for the file system
export const FS_STORAGE_KEYS = {
  FILE_SYSTEM_STATE: 'filesystem-state',
  FILE_CONTENT_PREFIX: 'file-content-',
  CURRENT_DIRECTORY: 'filesystem-cwd',
} as const;

// File system configuration
export const FS_CONFIG = {
  MAX_FILE_SIZE: 1024 * 1024, // 1MB per file
  MAX_TOTAL_SIZE: 10 * 1024 * 1024, // 10MB total
  MAX_PATH_LENGTH: 260,
  MAX_FILENAME_LENGTH: 255,
  RESERVED_NAMES: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'],
  INVALID_CHARS: ['<', '>', ':', '"', '|', '?', '*', '\0'],
} as const;

export const FILE_EXTENSIONS = {
  text: ['.txt', '.md', '.readme', '.log'],
  code: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.xml', '.yaml', '.yml'],
  config: ['.conf', '.config', '.ini', '.env', '.properties'],
  data: ['.csv', '.sql', '.db'],
  archive: ['.zip', '.tar', '.gz', '.rar'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.rtf'],
} as const;

export const DEFAULT_PERMISSIONS = {
  file: 'rw-r--r--',
  directory: 'rwxr-xr-x',
} as const;

export class PathUtils {
  static readonly SEPARATOR = '/';
  static readonly ROOT = '/';

  static normalize(path: string): string {
    if (!path) return this.ROOT;

    // Convert backslashes to forward slashes
    path = path.replace(/\\/g, this.SEPARATOR);

    // Split into segments and filter out empty ones
    const segments = path.split(this.SEPARATOR).filter(segment => segment && segment !== '.');

    // Handle relative paths and '..' segments
    const normalized: string[] = [];

    for (const segment of segments) {
      if (segment === '..') {
        if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
          normalized.pop();
        } else if (!path.startsWith(this.SEPARATOR)) {
          // Only allow '..' in relative paths
          normalized.push(segment);
        }
      } else {
        normalized.push(segment);
      }
    }

    // Construct final path
    const result = (path.startsWith(this.SEPARATOR) ? this.SEPARATOR : '') + normalized.join(this.SEPARATOR);
    return result || (path.startsWith(this.SEPARATOR) ? this.ROOT : '.');
  }

  static join(...paths: string[]): string {
    return this.normalize(paths.join(this.SEPARATOR));
  }

  static dirname(path: string): string {
    const normalized = this.normalize(path);
    if (normalized === this.ROOT) return this.ROOT;

    const lastSeparator = normalized.lastIndexOf(this.SEPARATOR);
    if (lastSeparator === 0) return this.ROOT;
    if (lastSeparator === -1) return '.';

    return normalized.substring(0, lastSeparator);
  }

  static basename(path: string, ext?: string): string {
    const normalized = this.normalize(path);
    const lastSeparator = normalized.lastIndexOf(this.SEPARATOR);
    let basename = lastSeparator === -1 ? normalized : normalized.substring(lastSeparator + 1);

    if (ext && basename.endsWith(ext)) {
      basename = basename.substring(0, basename.length - ext.length);
    }

    return basename;
  }

  static extname(path: string): string {
    const basename = this.basename(path);
    const lastDot = basename.lastIndexOf('.');
    return lastDot === -1 || lastDot === 0 ? '' : basename.substring(lastDot);
  }

  static isAbsolute(path: string): boolean {
    return path.startsWith(this.SEPARATOR);
  }

  static resolve(from: string, to: string): string {
    if (this.isAbsolute(to)) {
      return this.normalize(to);
    }
    return this.normalize(this.join(from, to));
  }

  static relative(from: string, to: string): string {
    const fromParts = this.normalize(from).split(this.SEPARATOR).filter(Boolean);
    const toParts = this.normalize(to).split(this.SEPARATOR).filter(Boolean);

    // Find common prefix
    let commonLength = 0;
    while (commonLength < fromParts.length &&
           commonLength < toParts.length &&
           fromParts[commonLength] === toParts[commonLength]) {
      commonLength++;
    }

    // Build relative path
    const upCount = fromParts.length - commonLength;
    const relativeParts = Array(upCount).fill('..').concat(toParts.slice(commonLength));

    return relativeParts.join(this.SEPARATOR) || '.';
  }

  static parseInfo(path: string): PathInfo {
    const normalized = this.normalize(path);
    const isAbsolute = this.isAbsolute(path);
    const segments = normalized.split(this.SEPARATOR).filter(Boolean);
    const parent = this.dirname(normalized);
    const basename = this.basename(normalized);
    const extension = this.extname(normalized);

    return {
      isAbsolute,
      segments,
      normalized,
      parent,
      basename,
      extension
    };
  }
}

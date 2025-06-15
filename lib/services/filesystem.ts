import {storage} from '@wxt-dev/storage';
import {
  CopyOptions,
  DEFAULT_PERMISSIONS,
  FileContent,
  FileNode,
  FileSystemError,
  FileSystemState,
  FileSystemStats,
  FS_CONFIG,
  FS_ERRORS,
  FS_STORAGE_KEYS,
  ListingOptions,
  PathUtils
} from './filesystem-types';

export class FileSystemService {
  private static instance: FileSystemService;
  private state: FileSystemState | null = null;
  private initialized = false;

  private constructor() {
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const savedState = await storage.getItem<FileSystemState>(
        `local:${FS_STORAGE_KEYS.FILE_SYSTEM_STATE}`
      );

      if (savedState) {
        this.state = savedState;
      } else {
        this.state = await this.createDefaultFileSystem();
        await this.saveState();
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize file system: ${error}`);
    }
  }

  private async createDefaultFileSystem(): Promise<FileSystemState> {
    const now = Date.now();
    const rootNode: FileNode = {
      name: '',
      type: 'directory',
      path: '/',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.directory,
      children: ['home', 'tmp']
    };

    const homeNode: FileNode = {
      name: 'home',
      type: 'directory',
      path: '/home',
      parent: '/',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.directory,
      children: ['user']
    };

    const userNode: FileNode = {
      name: 'user',
      type: 'directory',
      path: '/home/user',
      parent: '/home',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.directory,
      children: []
    };

    const tmpNode: FileNode = {
      name: 'tmp',
      type: 'directory',
      path: '/tmp',
      parent: '/',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.directory,
      children: []
    };

    const welcomeContent: FileContent = {
      id: 'welcome-txt',
      content: `Welcome to Terminal New Tab File System!

This is a virtual file system that persists in your browser's Chrome storage.
You can create, edit, and organize files just like a real terminal.

Try these commands:
- ls          List directory contents
- mkdir docs  Create a new directory
- touch file.txt  Create a new file
- echo "Hello" > file.txt  Write to a file
- cat file.txt  Read file contents

Your files will persist across browser sessions!`,
      encoding: 'utf-8'
    };

    const welcomeNode: FileNode = {
      name: 'welcome.txt',
      type: 'file',
      path: '/home/user/welcome.txt',
      parent: '/home/user',
      size: welcomeContent.content.length,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.file,
      extension: '.txt',
      contentId: welcomeContent.id
    };

    await storage.setItem(
      `local:${FS_STORAGE_KEYS.FILE_CONTENT_PREFIX}${welcomeContent.id}`,
      welcomeContent
    );

    userNode.children!.push('welcome.txt');

    return {
      nodes: {
        '/': rootNode,
        '/home': homeNode,
        '/home/user': userNode,
        '/home/user/welcome.txt': welcomeNode,
        '/tmp': tmpNode
      },
      currentWorkingDirectory: '/home/user',
      rootPath: '/'
    };
  }

  private async saveState(): Promise<void> {
    if (!this.state) throw this.createError(FS_ERRORS.EINVAL, 'File system not initialized');

    await storage.setItem(
      `local:${FS_STORAGE_KEYS.FILE_SYSTEM_STATE}`,
      this.state
    );
  }

  getCurrentDirectory(): string {
    if (!this.state) throw this.createError(FS_ERRORS.EINVAL, 'File system not initialized');
    return this.state.currentWorkingDirectory;
  }

  async changeDirectory(path: string): Promise<void> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    const node = this.state!.nodes[resolvedPath];

    if (!node) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${path}`, resolvedPath);
    }

    if (node.type !== 'directory') {
      throw this.createError(FS_ERRORS.ENOTDIR, `Not a directory: ${path}`, resolvedPath);
    }

    this.state!.currentWorkingDirectory = resolvedPath;
    await this.saveState();
  }

  async listDirectory(path?: string, options: ListingOptions = {}): Promise<FileNode[]> {
    await this.ensureInitialized();

    const targetPath = path ? this.resolvePath(path) : this.state!.currentWorkingDirectory;
    const node = this.state!.nodes[targetPath];

    if (!node) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${path || targetPath}`, targetPath);
    }

    if (node.type !== 'directory') {
      throw this.createError(FS_ERRORS.ENOTDIR, `Not a directory: ${path || targetPath}`, targetPath);
    }

    const children = node.children || [];
    const items: FileNode[] = [];

    for (const childName of children) {
      const childPath = PathUtils.join(targetPath, childName);
      const childNode = this.state!.nodes[childPath];
      if (childNode) {
        if (!options.showHidden && childName.startsWith('.')) {
          continue;
        }
        items.push(childNode);
      }
    }

    this.sortItems(items, options);

    return items;
  }

  async createDirectory(path: string, recursive = false): Promise<void> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    this.validatePath(resolvedPath);

    // Check if already exists
    if (this.state!.nodes[resolvedPath]) {
      throw this.createError(FS_ERRORS.EEXIST, `File exists: ${path}`, resolvedPath);
    }

    const pathInfo = PathUtils.parseInfo(resolvedPath);
    const parentPath = pathInfo.parent;

    // Check if parent exists
    const parentNode = this.state!.nodes[parentPath];
    if (!parentNode) {
      if (recursive) {
        await this.createDirectory(parentPath, true);
      } else {
        throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${parentPath}`, parentPath);
      }
    } else if (parentNode.type !== 'directory') {
      throw this.createError(FS_ERRORS.ENOTDIR, `Not a directory: ${parentPath}`, parentPath);
    }

    const now = Date.now();
    this.state!.nodes[resolvedPath] = {
      name: pathInfo.basename,
      type: 'directory',
      path: resolvedPath,
      parent: parentPath,
      size: 0,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.directory,
      children: []
    };

    const parent = this.state!.nodes[parentPath];
    if (parent && parent.children) {
      parent.children.push(pathInfo.basename);
      parent.children.sort();
      parent.modifiedAt = now;
    }

    await this.saveState();
  }

  async createFile(path: string, content = '', force = false): Promise<void> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    this.validatePath(resolvedPath);

    // Check if already exists
    if (this.state!.nodes[resolvedPath] && !force) {
      throw this.createError(FS_ERRORS.EEXIST, `File exists: ${path}`, resolvedPath);
    }

    const pathInfo = PathUtils.parseInfo(resolvedPath);
    const parentPath = pathInfo.parent;

    // Check if parent exists and is a directory
    const parentNode = this.state!.nodes[parentPath];
    if (!parentNode) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${parentPath}`, parentPath);
    }
    if (parentNode.type !== 'directory') {
      throw this.createError(FS_ERRORS.ENOTDIR, `Not a directory: ${parentPath}`, parentPath);
    }

    // Check storage limits
    await this.checkStorageLimit(content.length);

    // Create file content
    const contentId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileContent: FileContent = {
      id: contentId,
      content,
      encoding: 'utf-8'
    };

    // Save content to storage
    await storage.setItem(
      `local:${FS_STORAGE_KEYS.FILE_CONTENT_PREFIX}${contentId}`,
      fileContent
    );

    const now = Date.now();
    this.state!.nodes[resolvedPath] = {
      name: pathInfo.basename,
      type: 'file',
      path: resolvedPath,
      parent: parentPath,
      size: content.length,
      createdAt: now,
      modifiedAt: now,
      permissions: DEFAULT_PERMISSIONS.file,
      extension: pathInfo.extension,
      contentId
    };

    const parent = this.state!.nodes[parentPath];
    if (parent && parent.children) {
      if (!parent.children.includes(pathInfo.basename)) {
        parent.children.push(pathInfo.basename);
        parent.children.sort();
      }
      parent.modifiedAt = now;
    }

    await this.saveState();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private resolvePath(path: string): string {
    if (!this.state) throw this.createError(FS_ERRORS.EINVAL, 'File system not initialized');

    if (PathUtils.isAbsolute(path)) {
      return PathUtils.normalize(path);
    }
    return PathUtils.resolve(this.state.currentWorkingDirectory, path);
  }

  private validatePath(path: string): void {
    if (path.length > FS_CONFIG.MAX_PATH_LENGTH) {
      throw this.createError(FS_ERRORS.EINVAL, `Path too long: ${path}`);
    }

    const basename = PathUtils.basename(path);
    if (basename.length > FS_CONFIG.MAX_FILENAME_LENGTH) {
      throw this.createError(FS_ERRORS.EINVAL, `Filename too long: ${basename}`);
    }

    for (const char of FS_CONFIG.INVALID_CHARS) {
      if (path.includes(char)) {
        throw this.createError(FS_ERRORS.EINVAL, `Invalid character in path: ${char}`);
      }
    }

    if (FS_CONFIG.RESERVED_NAMES.includes(basename.toUpperCase() as any)) {
      throw this.createError(FS_ERRORS.EINVAL, `Reserved filename: ${basename}`);
    }
  }

  private async checkStorageLimit(additionalSize: number): Promise<void> {
    const stats = await this.getStats();
    if (stats.storageUsed + additionalSize > FS_CONFIG.MAX_TOTAL_SIZE) {
      throw this.createError(FS_ERRORS.ENOSPC, 'No space left on device');
    }
  }

  private sortItems(items: FileNode[], options: ListingOptions): void {
    const {sortBy = 'name', reverse = false} = options;

    items.sort((a, b) => {
      let comparison = 0;

      if (a.type !== b.type) {
        comparison = a.type === 'directory' ? -1 : 1;
      } else {
        switch (sortBy) {
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'date':
            comparison = a.modifiedAt - b.modifiedAt;
            break;
          case 'type':
            comparison = (a.extension || '').localeCompare(b.extension || '');
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
      }

      return reverse ? -comparison : comparison;
    });
  }

  private createError(code: string, message: string, path?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    error.path = path;
    return error;
  }

  async readFile(path: string): Promise<string> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    const node = this.state!.nodes[resolvedPath];

    if (!node) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${path}`, resolvedPath);
    }

    if (node.type !== 'file') {
      throw this.createError(FS_ERRORS.EISDIR, `Is a directory: ${path}`, resolvedPath);
    }

    if (!node.contentId) {
      return ''; // Empty file
    }

    const content = await storage.getItem<FileContent>(
      `local:${FS_STORAGE_KEYS.FILE_CONTENT_PREFIX}${node.contentId}`
    );

    return content?.content || '';
  }

  async writeFile(path: string, content: string, append = false): Promise<void> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    const node = this.state!.nodes[resolvedPath];

    if (node && node.type !== 'file') {
      throw this.createError(FS_ERRORS.EISDIR, `Is a directory: ${path}`, resolvedPath);
    }

    let finalContent = content;
    if (append && node) {
      const existingContent = await this.readFile(path);
      finalContent = existingContent + content;
    }

    if (node) {
      // Update existing file
      await this.checkStorageLimit(finalContent.length - node.size);

      const contentId = node.contentId || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileContent: FileContent = {
        id: contentId,
        content: finalContent,
        encoding: 'utf-8'
      };

      await storage.setItem(
        `local:${FS_STORAGE_KEYS.FILE_CONTENT_PREFIX}${contentId}`,
        fileContent
      );

      node.size = finalContent.length;
      node.modifiedAt = Date.now();
      node.contentId = contentId;

      await this.saveState();
    } else {
      // Create new file
      await this.createFile(path, finalContent);
    }
  }

  async delete(path: string, recursive = false): Promise<void> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    const node = this.state!.nodes[resolvedPath];

    if (!node) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${path}`, resolvedPath);
    }

    if (node.type === 'directory') {
      const children = node.children || [];
      if (children.length > 0 && !recursive) {
        throw this.createError(FS_ERRORS.ENOTEMPTY, `Directory not empty: ${path}`, resolvedPath);
      }

      for (const childName of children) {
        const childPath = PathUtils.join(resolvedPath, childName);
        await this.delete(childPath, true);
      }
    } else {
      if (node.contentId) {
        await storage.removeItem(
          `local:${FS_STORAGE_KEYS.FILE_CONTENT_PREFIX}${node.contentId}`
        );
      }
    }

    if (node.parent) {
      const parent = this.state!.nodes[node.parent];
      if (parent && parent.children) {
        const index = parent.children.indexOf(node.name);
        if (index > -1) {
          parent.children.splice(index, 1);
          parent.modifiedAt = Date.now();
        }
      }
    }

    delete this.state!.nodes[resolvedPath];

    await this.saveState();
  }

  async copy(sourcePath: string, destPath: string, options: CopyOptions = {}): Promise<void> {
    await this.ensureInitialized();

    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedDest = this.resolvePath(destPath);

    const sourceNode = this.state!.nodes[resolvedSource];
    if (!sourceNode) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${sourcePath}`, resolvedSource);
    }

    // Check if destination exists
    const destNode = this.state!.nodes[resolvedDest];
    if (destNode && !options.force) {
      throw this.createError(FS_ERRORS.EEXIST, `File exists: ${destPath}`, resolvedDest);
    }

    if (sourceNode.type === 'file') {
      const content = await this.readFile(sourcePath);
      await this.createFile(destPath, content, options.force);

      if (options.preserveTimestamps) {
        const newNode = this.state!.nodes[resolvedDest];
        if (newNode) {
          newNode.createdAt = sourceNode.createdAt;
          newNode.modifiedAt = sourceNode.modifiedAt;
        }
      }
    } else {
      // Directory copy
      if (!options.recursive) {
        throw this.createError(FS_ERRORS.EISDIR, `Is a directory: ${sourcePath}`, resolvedSource);
      }

      await this.createDirectory(destPath);

      const children = sourceNode.children || [];
      for (const childName of children) {
        const childSource = PathUtils.join(resolvedSource, childName);
        const childDest = PathUtils.join(resolvedDest, childName);
        await this.copy(childSource, childDest, options);
      }
    }

    await this.saveState();
  }

  async move(sourcePath: string, destPath: string): Promise<void> {
    await this.copy(sourcePath, destPath, {recursive: true, force: true});
    await this.delete(sourcePath, true);
  }

  async exists(path: string): Promise<boolean> {
    await this.ensureInitialized();
    const resolvedPath = this.resolvePath(path);
    return !!this.state!.nodes[resolvedPath];
  }

  async stat(path: string): Promise<FileNode> {
    await this.ensureInitialized();

    const resolvedPath = this.resolvePath(path);
    const node = this.state!.nodes[resolvedPath];

    if (!node) {
      throw this.createError(FS_ERRORS.ENOENT, `No such file or directory: ${path}`, resolvedPath);
    }

    return {...node};
  }

  async getStats(): Promise<FileSystemStats> {
    await this.ensureInitialized();

    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;

    for (const node of Object.values(this.state!.nodes)) {
      if (node.type === 'file') {
        totalFiles++;
        totalSize += node.size;
      } else {
        totalDirectories++;
      }
    }

    return {
      totalFiles,
      totalDirectories,
      totalSize,
      storageUsed: totalSize,
      storageLimit: FS_CONFIG.MAX_TOTAL_SIZE
    };
  }
}

export const fileSystem = FileSystemService.getInstance();

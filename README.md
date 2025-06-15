# Privex

> A terminal-style new tab page for Chrome and Firefox - built for nerds who love the command line.

[![Build Status](https://github.com/monokaijs/Privex/actions/workflows/build-production.yml/badge.svg)](https://github.com/monokaijs/Privex/actions)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Features

### 🖥️ Full Terminal Experience
- **Real Terminal Emulation**: Powered by xterm.js for authentic terminal feel
- **Smart Autocomplete**: Tab completion for commands, files, themes, and arguments
- **Command History**: Navigate through previous commands with arrow keys
- **Multiple Terminal Windows**: Open popup terminals for multitasking
- **Unix-like Commands**: Familiar filesystem navigation and file operations

### 📁 Virtual File System
- **Persistent Storage**: Files and directories persist across browser sessions
- **Complete File Operations**: Create, read, write, copy, move, and delete files
- **Directory Navigation**: Full directory tree with `cd`, `ls`, `pwd`, `mkdir`
- **File Management**: Built-in file manager with `tree`, `find`, `grep` commands

### ✨ Code Editor Integration
- **Syntax Highlighting**: Support for JavaScript, Python, HTML, CSS, JSON, Markdown
- **Multiple Language Support**: CodeMirror-powered editor with theme integration
- **File Editing**: Edit files directly with `nano`, `less` commands
- **Save Functionality**: Ctrl+S / Cmd+S to save files

### 🎨 Customizable Themes
- **Preset Themes**: Dark, Light, Matrix, Retro Amber
- **Custom Themes**: Create and import your own color schemes
- **Theme Export/Import**: Share themes via JSON
- **Live Theme Switching**: Change themes on the fly

### 🔍 Integrated Search
- **Multiple Search Engines**: Google, YouTube, Stack Overflow shortcuts
- **Quick Navigation**: `open` command for instant website access
- **Search Configuration**: Customize default search engine and behavior

### ⚙️ Advanced Configuration
- **Background Images**: Set custom background images with opacity control
- **Font Customization**: Configurable fonts and sizes
- **Layout Options**: Padding, borders, and responsive design
- **Persistent Settings**: All configurations saved automatically

## 📦 Installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/monokaijs/Privex.git
   cd Privex
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   # For Chrome
   npm run build
   
   # For Firefox
   npm run build:firefox
   ```

4. Load the extension:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked" and select the `.output/chrome-mv3` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on" and select the manifest file from `.output/firefox-mv2`

### Development Mode
```bash
# Start development server for Chrome
npm run dev

# Start development server for Firefox
npm run dev:firefox
```

## 🎯 Quick Start

Once installed, open a new tab and you'll see the Privex terminal. Try these commands:

```bash
# Get help
help

# See all available commands
help

# Try autocomplete (press Tab to complete)
th<Tab>                    # Completes to "theme"
ls doc<Tab>                # Completes to "documents/"
theme set d<Tab>           # Completes to "dark"

# Navigate the file system
pwd
ls
mkdir documents
cd documents
touch readme.txt
echo "Hello World" > readme.txt
cat readme.txt

# Change themes
theme list
theme set matrix

# Open websites
open github.com
search "React hooks"
youtube "terminal tutorial"

# Open code editor
editor
nano readme.txt

# Configure background
config background image "https://example.com/bg.jpg"
config background brightness 0.3

# Learn about autocomplete
autocomplete
```

## 📚 Command Reference

### File System Commands
| Command | Description | Example |
|---------|-------------|---------|
| `pwd` | Print working directory | `pwd` |
| `cd <path>` | Change directory | `cd documents` |
| `ls [path] [-l] [-a]` | List directory contents | `ls -la` |
| `mkdir <dir> [-p]` | Create directory | `mkdir -p projects/web` |
| `touch <file>` | Create empty file | `touch index.html` |
| `cat <file>` | Display file contents | `cat package.json` |
| `echo <text> > <file>` | Write to file | `echo "test" > file.txt` |
| `rm <path> [-r]` | Remove files/directories | `rm -r old_folder` |
| `cp <src> <dest>` | Copy files | `cp file.txt backup.txt` |
| `mv <src> <dest>` | Move/rename files | `mv old.txt new.txt` |

### File Operations
| Command | Description | Example |
|---------|-------------|---------|
| `head <file> [-n]` | Show first lines | `head -n 10 log.txt` |
| `tail <file> [-n]` | Show last lines | `tail -n 5 error.log` |
| `wc <file>` | Word/line/char count | `wc document.txt` |
| `find <pattern>` | Find files | `find "*.js"` |
| `grep <pattern> <file>` | Search in file | `grep "function" app.js` |
| `tree [path]` | Show directory tree | `tree projects` |

### Editor Commands
| Command | Description | Example |
|---------|-------------|---------|
| `editor [file]` | Open code editor | `editor app.js` |
| `nano <file>` | Edit file in nano-style | `nano config.json` |
| `less <file>` | View file with paging | `less large_file.txt` |

### Navigation & Search
| Command | Description | Example |
|---------|-------------|---------|
| `open <url>` | Open website | `open github.com` |
| `search <query>` | Search with default engine | `search "javascript tutorial"` |
| `youtube <query>` | Search YouTube | `youtube "coding music"` |
| `stackoverflow <query>` | Search Stack Overflow | `stackoverflow "react hooks"` |

### Customization
| Command | Description | Example |
|---------|-------------|---------|
| `theme list` | List available themes | `theme list` |
| `theme set <name>` | Change theme | `theme set matrix` |
| `theme export <name>` | Export theme to JSON | `theme export dark` |
| `theme import <json>` | Import custom theme | `theme import {...}` |
| `config show` | Show current config | `config show` |
| `config background image <url>` | Set background image | `config background image "url"` |
| `config background brightness <0-1>` | Set opacity | `config background brightness 0.5` |

### System Commands
| Command | Description | Example |
|---------|-------------|---------|
| `help [command]` | Show help | `help theme` |
| `about` | Show extension info | `about` |
| `autocomplete` | Show autocomplete help | `autocomplete` |
| `history` | Show command history | `history` |
| `clear` | Clear terminal | `clear` |
| `time` | Show current time | `time` |
| `t` | Open terminal popup | `t` |

## 🚀 Autocomplete System

Privex features a powerful autocomplete system that makes terminal usage faster and more intuitive:

### ⌨️ Autocomplete Controls
- **Tab**: Complete current word or show suggestions
- **Tab Tab**: Cycle through multiple completions
- **Shift+Tab**: Cycle backwards through completions
- **Arrow Up/Down**: Navigate completion list
- **Enter**: Select highlighted completion
- **Escape**: Close completion list

### 🎯 Smart Completion Types

#### Command Completion
```bash
th<Tab>        # → theme
he<Tab>        # → help
op<Tab>        # → open
```

#### File & Directory Completion
```bash
ls doc<Tab>           # → documents/
cat file<Tab>         # → file.txt
cd /home/u<Tab>       # → /home/user/
nano project<Tab>     # → project.js
```

#### Theme Completion
```bash
theme set d<Tab>      # → dark
theme set m<Tab>      # → matrix
theme export r<Tab>   # → retro
```

#### Configuration Completion
```bash
config b<Tab>                    # → background
config background i<Tab>         # → image
config background brightness<Tab> # → brightness values
```

#### URL Completion
```bash
open git<Tab>         # → github.com
open stack<Tab>       # → stackoverflow.com
```

### 💡 Advanced Features
- **Context-aware**: Completions change based on the command and argument position
- **File type filtering**: Only shows relevant files for specific commands
- **Hidden file support**: Shows hidden files when typing `.`
- **Multi-level navigation**: Complete through directory hierarchies
- **Common prefix completion**: Automatically completes shared prefixes
- **Fuzzy matching**: Finds completions even with partial matches

## 🎨 Theme Customization

### Available Preset Themes
- **Dark**: Classic dark terminal with white text
- **Light**: Clean light theme with dark text  
- **Matrix**: Green matrix-style theme
- **Retro**: Vintage amber terminal theme

### Creating Custom Themes
Export an existing theme as a starting point:
```bash
theme export dark
```

This copies a JSON theme definition to your clipboard. Modify the colors and import:
```bash
theme import '{"name":"custom","displayName":"My Theme",...}'
```

### Theme Structure
```json
{
  "name": "custom",
  "displayName": "Custom Theme",
  "author": "Your Name",
  "description": "My custom theme",
  "colors": {
    "background": "#000000",
    "text": "#ffffff",
    "prompt": "#00ff00",
    "cursor": "#ffffff",
    "success": "#00ff00",
    "error": "#ff0000",
    "info": "#ffff00"
  },
  "typography": {
    "fontFamily": "JetBrains Mono, monospace",
    "fontSize": "14px"
  }
}
```

## 🛠️ Development

### Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: WXT (Web Extension Toolkit)
- **Terminal**: xterm.js with fit addon
- **Editor**: CodeMirror 6
- **State Management**: Redux Toolkit with Redux Persist
- **Styling**: CSS with theme system

### Project Structure
```
├── entrypoints/          # Extension entry points
│   ├── background.ts     # Background script
│   └── newtab/          # New tab page
├── lib/                 # Core library code
│   ├── commands/        # Terminal commands
│   ├── components/      # React components
│   ├── services/        # File system & services
│   ├── store/          # Redux store & slices
│   └── themes/         # Theme system
├── public/             # Static assets
└── wxt.config.ts       # WXT configuration
```

### Building
```bash
# Development
npm run dev              # Chrome development
npm run dev:firefox      # Firefox development

# Production
npm run build            # Chrome production
npm run build:firefox    # Firefox production
npm run zip              # Create Chrome zip
npm run zip:firefox      # Create Firefox zip

# Type checking
npm run compile          # TypeScript compilation check
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**@monokaijs** - [GitHub](https://github.com/monokaijs)

## 🙏 Acknowledgments

- [xterm.js](https://xtermjs.org/) - Terminal emulation
- [CodeMirror](https://codemirror.net/) - Code editor
- [WXT](https://wxt.dev/) - Web extension framework
- [React](https://react.dev/) - UI framework

---

*Built with ❤️ for developers who live in the terminal*

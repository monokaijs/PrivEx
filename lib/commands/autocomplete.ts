import { defineCommand } from './types';

export const autocompleteCommand = defineCommand({
  name: ['autocomplete', 'tab'],
  description: 'Show information about autocomplete functionality',
  category: 'information',
  examples: [
    'autocomplete',
    'tab'
  ],
  handler: (ctx, args) => {
    return `Autocomplete Help

The terminal supports intelligent autocomplete using the Tab key:

🔧 BASIC USAGE:
  Tab                    - Complete current word or show suggestions
  Tab Tab                - Cycle through multiple completions
  Shift+Tab              - Cycle backwards through completions
  Arrow Up/Down          - Navigate completion list
  Enter                  - Select highlighted completion
  Escape                 - Close completion list

📁 FILE & DIRECTORY COMPLETION:
  ls doc<Tab>            - Complete to "documents/"
  cat file<Tab>          - Complete to available files
  cd /home/u<Tab>        - Complete to "/home/user/"
  
🎯 COMMAND COMPLETION:
  th<Tab>                - Complete to "theme"
  he<Tab>                - Complete to "help"
  
🎨 THEME COMPLETION:
  theme set d<Tab>       - Complete to "dark"
  theme export m<Tab>    - Complete to "matrix"
  
⚙️ CONFIG COMPLETION:
  config b<Tab>          - Complete to "background"
  config background i<Tab> - Complete to "image"
  
🔍 SEARCH ENGINE COMPLETION:
  search-config engine g<Tab> - Complete to "google"
  
🌐 URL COMPLETION:
  open git<Tab>          - Complete to "github.com"
  
💡 SMART FEATURES:
  - Context-aware completions based on command
  - File type filtering for appropriate commands
  - Hidden file completion (files starting with .)
  - Automatic common prefix completion
  - Multi-level directory navigation
  
Try typing a partial command or filename and press Tab to see it in action!`;
  }
});

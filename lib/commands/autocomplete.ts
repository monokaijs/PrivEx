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

The terminal supports intelligent autocomplete with two modes:

🔧 TAB COMPLETION:
  Tab                    - Complete current word or show suggestions
  Tab Tab                - Cycle through multiple completions
  Shift+Tab              - Cycle backwards through completions
  Arrow Up/Down          - Navigate completion list
  Enter                  - Select highlighted completion
  Escape                 - Close completion list

✨ LIVE SUGGESTIONS:
  Type                   - Shows suggestions automatically as you type
  Arrow Up/Down          - Navigate suggestion list
  Enter                  - Select highlighted suggestion
  Escape                 - Close suggestion list

  Enable/disable: config terminal live-suggestions true/false

🌐 REAL-TIME DOMAIN SUGGESTIONS:
  When typing first command (2+ chars, no spaces), see matching domains from Chrome history
  Searches your history in real-time as you type
  Click domain suggestions to open URLs directly (no need to type 'open')
  Visual indicators: ⚡ commands, 🌐 domains, 📁 files, 🎨 themes
  Test domains: domains test <query>, domains cache, domains clear

🔍 GOOGLE SEARCH SUGGESTIONS:
  When typing queries with whitespace that don't match commands (3+ chars)
  Fetches real-time suggestions from Google's autocomplete API
  Click suggestions to execute search command directly
  Works for queries like: "how to code", "javascript tutorial", "best practices"
  Visual indicator: 🔍 search suggestions

🔍 SMART NAVIGATION & SEARCH:
  Type domains/URLs (e.g., "github.com", "https://example.com") to open directly
  Type anything with spaces (e.g., "javascript tutorials") to search automatically
  No need to type 'open' or 'search' commands first - just type what you want
  Uses your configured search engine (default: Google)

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
  - Live suggestions with 300ms debounce
  - Configurable suggestion modes

Try typing a partial command, filename, or search query to see live suggestions, or press Tab for traditional completion!`;
  }
});

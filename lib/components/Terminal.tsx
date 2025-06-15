import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Terminal as XTerm} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {executeCommand} from '../commands/registry';
import type {CommandContext, HistoryEntry} from '../commands/types';
import {useAppSelector} from '../store/hooks';
import {
  selectBackgroundBlur,
  selectBackgroundBrightness,
  selectBackgroundConfig,
  selectCurrentTheme,
  selectCurrentThemeName,
  selectLiveSuggestions,
  selectIsInChatMode,
  selectCurrentChat,
  selectIsStreaming
} from '../store/selectors';
import {autocompleteService, CompletionResult} from '../services/autocomplete';
import CompletionList from './CompletionList';
import {openaiService} from '../services/openai';
import {store} from '../store';
import {exitChatMode, setStreaming} from '../store/slices/openaiSlice';
import '@xterm/xterm/css/xterm.css';

const convertThemeToXterm = (theme: any) => {
  return {
    background: theme.colors.background,
    foreground: theme.colors.text,
    cursor: theme.colors.cursor || theme.colors.text,
    selection: theme.colors.selection || theme.colors.border,
    black: theme.colors.background,
    red: '#ff6b6b',
    green: '#51cf66',
    yellow: '#ffd43b',
    blue: '#74c0fc',
    magenta: '#f06292',
    cyan: '#4dd0e1',
    white: theme.colors.text,
    brightBlack: '#666666',
    brightRed: '#ff8a80',
    brightGreen: '#69f0ae',
    brightYellow: '#ffff8d',
    brightBlue: '#82b1ff',
    brightMagenta: '#ff80ab',
    brightCyan: '#00ffff',
    brightWhite: theme.colors.text
  };
};

export interface TerminalProps {
  welcomeMessage?: string;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  applyGlobalTheme?: boolean;
  exposeGlobalContext?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
                                                    welcomeMessage = 'Welcome to Privex. Type "help" for available commands.',
                                                    onClose,
                                                    className = '',
                                                    style = {},
                                                    applyGlobalTheme = false,
                                                    exposeGlobalContext = false
                                                  }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [selectedCompletionIndex, setSelectedCompletionIndex] = useState(0);
  const [showCompletions, setShowCompletions] = useState(false);
  const [completionPosition, setCompletionPosition] = useState({x: 0, y: 0});

  const [showLiveSuggestions, setShowLiveSuggestions] = useState(false);
  const [liveSuggestionResult, setLiveSuggestionResult] = useState<CompletionResult | null>(null);
  const liveSuggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTheme = useAppSelector(selectCurrentTheme);
  const currentThemeName = useAppSelector(selectCurrentThemeName);
  const backgroundConfig = useAppSelector(selectBackgroundConfig);
  const brightness = useAppSelector(selectBackgroundBrightness);
  const blur = useAppSelector(selectBackgroundBlur);
  const liveSuggestionsEnabled = useAppSelector(selectLiveSuggestions);
  const isInChatMode = useAppSelector(selectIsInChatMode);
  const currentChat = useAppSelector(selectCurrentChat);
  const isStreaming = useAppSelector(selectIsStreaming);

  useEffect(() => {
    if (isInChatMode) {
      store.dispatch(exitChatMode());
    }
  }, []);

  useEffect(() => {
    if (isInChatMode) {
      setShowCompletions(false);
      setCompletionResult(null);
      setShowLiveSuggestions(false);
      setLiveSuggestionResult(null);
      if (liveSuggestionsTimeoutRef.current) {
        clearTimeout(liveSuggestionsTimeoutRef.current);
      }
    }
  }, [isInChatMode]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerm({
      cursorBlink: false,
      fontSize: parseInt(currentTheme.typography?.fontSize || '14'),
      fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
      theme: convertThemeToXterm(currentTheme),
      allowProposedApi: true,
      disableStdin: true,
      cursorInactiveStyle: 'none',
    });

    terminal.onData(data => {
    })

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    welcomeMessage.split('\n').forEach(msg => terminal.writeln(msg));

    if (applyGlobalTheme) {
      import('../themes/utils').then(({applyThemeStyles}) => {
        applyThemeStyles(currentTheme);
      });
    }

    if (exposeGlobalContext) {
      (window as any).__terminalThemeContext = {currentTheme};
      (window as any).__terminalCommandHistory = commandHistory;
      (window as any).__terminalInstance = terminal;
    }

    // Focus input after terminal is fully initialized
    if (applyGlobalTheme) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }

    return () => {
      terminal.dispose();
    };
  }, [welcomeMessage, applyGlobalTheme, exposeGlobalContext]);

  useEffect(() => {
    if (!applyGlobalTheme) return; // Only for main terminal

    const handleVisibilityChange = () => {
      if (!document.hidden && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    const handleFocus = () => {
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input when user starts typing (except for special keys)
      if (!e.ctrlKey && !e.altKey && !e.metaKey &&
        e.key.length === 1 && inputRef.current &&
        document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyGlobalTheme]);

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = convertThemeToXterm(currentTheme);
    }

    // Update global theme if this is the main terminal
    if (applyGlobalTheme) {
      import('../themes/utils').then(({applyThemeStyles}) => {
        applyThemeStyles(currentTheme);
      });
    }
  }, [currentTheme, applyGlobalTheme]);

  useEffect(() => {
    if (applyGlobalTheme) {
      import('../commands/config').then(({applyBackgroundConfig}) => {
        applyBackgroundConfig(backgroundConfig);
      });
    }
  }, [applyGlobalTheme, backgroundConfig]);

  // Utility function to check if input is a valid domain or URL
  const isValidDomainOrUrl = useCallback((input: string): boolean => {
    // Check if it's a valid URL
    try {
      new URL(input);
      return true;
    } catch {
      // Not a valid URL, check if it's a domain
    }

    // Check if it looks like a domain
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Must have at least one dot and valid domain format
    if (!input.includes('.') || !domainRegex.test(input)) {
      return false;
    }

    // Check for valid TLD (at least 2 characters)
    const parts = input.split('.');
    const tld = parts[parts.length - 1];

    return tld.length >= 2 && /^[a-zA-Z]+$/.test(tld);
  }, []);

  // Handle chat message sending
  const handleChatMessage = useCallback(async (message: string) => {
    const terminal = xtermRef.current;
    if (!terminal || !currentChat) return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Clear input immediately when message is committed
    setCurrentInput('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Check for exit commands
    if (trimmedMessage.toLowerCase() === 'exit' || trimmedMessage.toLowerCase() === 'leave') {
      store.dispatch(exitChatMode());
      terminal.writeln('');
      terminal.write('\x1b[36mExited chat mode. You are now back in command mode.\x1b[0m');
      terminal.writeln('');
      return;
    }

    // Echo user message
    terminal.writeln(`You: ${trimmedMessage}`);
    terminal.writeln('');

    // Show processing indicator
    terminal.write('\x1b[33m⏳ Processing...\x1b[0m');

    store.dispatch(setStreaming(true));

    try {
      const stream = await openaiService.sendMessage(currentChat.id, trimmedMessage);

      // Clear processing indicator and show AI response
      terminal.write('\r\x1b[K'); // Clear current line
      terminal.write('\x1b[36mAI: \x1b[0m');

      let assistantResponse = '';

      for await (const chunk of stream) {
        if (chunk.error) {
          terminal.write('\r\x1b[K'); // Clear current line
          terminal.write(`\x1b[31mError: ${chunk.error}\x1b[0m`);
          terminal.writeln('');
          break;
        }

        if (chunk.content) {
          assistantResponse += chunk.content;

          // Output content naturally, but replace \n with proper terminal newlines
          const content = chunk.content.replace(/\n/g, '\r\n');
          terminal.write(content);
        }

        if (chunk.isComplete) {
          terminal.writeln('');
          terminal.writeln('');
          break;
        }
      }
    } catch (error) {
      terminal.write('\r\x1b[K'); // Clear current line
      terminal.write(`\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      terminal.writeln('');
      terminal.writeln('');
    } finally {
      store.dispatch(setStreaming(false));
    }
  }, [currentChat]);

  // Handle command execution
  const handleExecuteCommand = useCallback(async (input: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    const trimmedCmd = input.trim();

    // Clear input immediately when command is committed
    setCurrentInput('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Handle blank command - just show new prompt (mimic system terminal)
    if (!trimmedCmd) {
      terminal.writeln('$ ');
      return;
    }

    // Echo the command to terminal
    terminal.writeln(`$ ${trimmedCmd}`);

    // Handle built-in popup commands
    if (trimmedCmd === 'close' && onClose) {
      onClose();
      return;
    }

    // Show loading indicator for commands that might take time
    const firstCommand = trimmedCmd.split(' ')[0];
    const showLoadingFor = ['chat', 'openai'];
    let loadingShown = false;

    if (showLoadingFor.includes(firstCommand)) {
      terminal.writeln('');
      terminal.write('\x1b[33m⏳ Loading...\x1b[0m');
      loadingShown = true;
    }

    // Create command context
    const ctx: CommandContext = {
      history,
      setHistory,
      input: currentInput,
      setInput: setCurrentInput,
      commandHistory,
      setCommandHistory,
      setHistoryIndex
    };

    // Parse command and arguments
    const [commandName, ...args] = trimmedCmd.split(' ');

    try {
      // Check if command exists
      const {getCommand} = await import('../commands/registry');
      const command = getCommand(commandName);

      // If command doesn't exist, check for special cases
      if (!command) {
        // Case 1: Input contains whitespace → treat as search
        if (trimmedCmd.includes(' ')) {
          // Execute as search command
          const {executeCommand: execCmd} = await import('../commands/registry');
          const result = await execCmd('search', [trimmedCmd], ctx);

          // Display result
          if (result.output !== undefined) {
            const lines = result.output.split('\n');
            lines.forEach(line => {
              terminal.writeln('');
              if (result.type === 'error') {
                terminal.write(`\x1b[31m${line}\x1b[0m`); // Red for errors
              } else if (result.type === 'success') {
                terminal.write(`\x1b[32m${line}\x1b[0m`); // Green for success
              } else {
                terminal.write(`\x1b[36m${line}\x1b[0m`); // Cyan for info
              }
            });
            terminal.writeln('');
          }

          // Update history
          setHistory(prev => [...prev, {
            command: trimmedCmd,
            output: (result.output || ''),
            type: result.type
          }]);

          // Update command history
          setCommandHistory(prev => [...prev, trimmedCmd]);
          setHistoryIndex(-1);
          return;
        }

        // Case 2: Input without spaces but is a valid domain or URL → treat as open URL
        if (!trimmedCmd.includes(' ') && isValidDomainOrUrl(trimmedCmd)) {
          // Execute as open command
          const url = trimmedCmd.startsWith('http') ? trimmedCmd : `https://${trimmedCmd}`;
          const {executeCommand: execCmd} = await import('../commands/registry');
          const result = await execCmd('open', [url], ctx);

          // Display result
          if (result.output !== undefined) {
            const lines = result.output.split('\n');
            lines.forEach(line => {
              terminal.writeln('');
              if (result.type === 'error') {
                terminal.write(`\x1b[31m${line}\x1b[0m`); // Red for errors
              } else if (result.type === 'success') {
                terminal.write(`\x1b[32m${line}\x1b[0m`); // Green for success
              } else {
                terminal.write(`\x1b[36m${line}\x1b[0m`); // Cyan for info
              }
            });
            terminal.writeln('');
          }

          // Update history
          setHistory(prev => [...prev, {
            command: `open ${url}`,
            output: (result.output || `Opening ${trimmedCmd}...`),
            type: result.type
          }]);

          // Update command history
          setCommandHistory(prev => [...prev, `open ${url}`]);
          setHistoryIndex(-1);
          return;
        }
      }

      // Execute command normally
      const result = await executeCommand(commandName, args, ctx);

      // Clear loading indicator if it was shown
      if (loadingShown) {
        terminal.write('\r\x1b[K'); // Clear current line
      }

      // Handle special exit chat mode response
      if (result.output === 'EXIT_CHAT_MODE') {
        store.dispatch(exitChatMode());
        terminal.writeln('');
        terminal.write('\x1b[36mExited chat mode. You are now back in command mode.\x1b[0m');
        terminal.writeln('');
      } else if (result.output !== undefined) {
        // Display result if there's output
        const lines = result.output.split('\n');
        lines.forEach(line => {
          terminal.writeln('');
          if (result.type === 'error') {
            terminal.write(`\x1b[31m${line}\x1b[0m`); // Red for errors
          } else if (result.type === 'success') {
            terminal.write(`\x1b[32m${line}\x1b[0m`); // Green for success
          } else {
            terminal.write(`\x1b[36m${line}\x1b[0m`); // Cyan for info
          }
        });
        terminal.writeln('');
      }

      // Update history
      setHistory(prev => [...prev, {
        command: trimmedCmd,
        output: (result.output || ''),
        type: result.type
      }]);
    } catch (error) {
      // Clear loading indicator if it was shown
      if (loadingShown) {
        terminal.write('\r\x1b[K'); // Clear current line
      }
      terminal.writeln('');
      terminal.write(`\x1b[31mError: ${error}\x1b[0m`);
      terminal.writeln('');
    }

    // Update command history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);
  }, [history, currentInput, commandHistory, onClose, isValidDomainOrUrl]);

  // Handle autocomplete
  const handleTabCompletion = useCallback(async () => {
    if (!inputRef.current || isInChatMode) return; // Disable autocomplete in chat mode

    const cursorPosition = inputRef.current.selectionStart || 0;
    const result = await autocompleteService.getCompletions(currentInput, cursorPosition);

    if (result.completions.length === 0) {
      // No completions available
      setShowCompletions(false);
      return;
    }

    if (result.completions.length === 1) {
      // Single completion - auto-complete immediately
      const completion = result.completions[0];
      const newInput = currentInput.substring(0, result.replaceStart) +
        completion +
        currentInput.substring(result.replaceEnd);

      setCurrentInput(newInput);
      if (inputRef.current) {
        inputRef.current.value = newInput;
        const newCursorPos = result.replaceStart + completion.length;
        setTimeout(() => {
          inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
      setShowCompletions(false);
    } else {
      const currentArgLength = currentInput.substring(result.replaceStart, result.replaceEnd).length;
      if (result.commonPrefix.length > currentArgLength) {
        const newInput = currentInput.substring(0, result.replaceStart) +
          result.commonPrefix +
          currentInput.substring(result.replaceEnd);

        setCurrentInput(newInput);
        if (inputRef.current) {
          inputRef.current.value = newInput;
          const newCursorPos = result.replaceStart + result.commonPrefix.length;
          setTimeout(() => {
            inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
      }

      setCompletionResult(result);
      setSelectedCompletionIndex(0);
      setShowCompletions(true);

      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const spacing = 8;
        setCompletionPosition({
          x: rect.left,
          y: rect.top - spacing
        });
      }
    }
  }, [currentInput, isInChatMode]);

  const handleLiveSuggestions = useCallback(async (input: string) => {
    if (!liveSuggestionsEnabled || !inputRef.current || input.trim() === '' || isInChatMode) {
      setShowLiveSuggestions(false);
      setLiveSuggestionResult(null);
      return;
    }

    if (liveSuggestionsTimeoutRef.current) {
      clearTimeout(liveSuggestionsTimeoutRef.current);
    }

    liveSuggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const cursorPosition = inputRef.current?.selectionStart || input.length;
        const result = await autocompleteService.getCompletions(input, cursorPosition);

        if (result.completions.length > 0) {
          setLiveSuggestionResult(result);
          setShowLiveSuggestions(true);

          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const spacing = 8; // Space between input and list
            setCompletionPosition({
              x: rect.left,
              y: rect.top - spacing // Position just above the input, let CompletionList handle height
            });
          }
        } else {
          setShowLiveSuggestions(false);
          setLiveSuggestionResult(null);
        }
      } catch (error) {
        setShowLiveSuggestions(false);
        setLiveSuggestionResult(null);
      }
    }, 50);
  }, [liveSuggestionsEnabled, isInChatMode]);

  const handleCompletionSelect = useCallback(async (completion: string, index: number) => {
    // Use the appropriate completion result (Tab completion or live suggestions)
    const activeResult = showCompletions ? completionResult : liveSuggestionResult;
    if (!activeResult || !inputRef.current) return;

    // Clear input immediately for domain and search suggestions (they execute immediately)
    const isDomainSuggestion = activeResult.completionsWithTypes &&
      activeResult.completionsWithTypes[index]?.type === 'domain';
    const isSearchSuggestion = activeResult.completionsWithTypes &&
      activeResult.completionsWithTypes[index]?.type === 'search';

    if (isDomainSuggestion || isSearchSuggestion) {
      setCurrentInput('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }

    if (isDomainSuggestion) {
      // For domain suggestions, open URL directly instead of setting input
      try {
        const url = completion.startsWith('http') ? completion : `https://${completion}`;

        // Execute open command directly
        const {executeCommand} = await import('../commands/registry');
        const ctx = {
          history,
          setHistory,
          input: currentInput,
          setInput: setCurrentInput,
          commandHistory,
          setCommandHistory,
          setHistoryIndex
        };

        await executeCommand('open', [url], ctx);

        // Clear input and show in terminal
        const terminal = xtermRef.current;
        if (terminal) {
          terminal.writeln(`$ open ${url}`);
          terminal.writeln('');
          terminal.write(`\x1b[32mOpening ${completion}...\x1b[0m`);
          terminal.writeln('');
        }

        // Update history
        setHistory(prev => [...prev, {
          command: `open ${url}`,
          output: `Opening ${completion}...`,
          type: 'success'
        }]);

        // Update command history
        setCommandHistory(prev => [...prev, `open ${url}`]);
        setHistoryIndex(-1);
      } catch (error) {
        console.error('Failed to open URL:', error);
        // Fall back to normal completion behavior
        const newInput = activeResult.originalInput.substring(0, activeResult.replaceStart) +
          completion +
          activeResult.originalInput.substring(activeResult.replaceEnd);
        setCurrentInput(newInput);
        inputRef.current.value = newInput;
      }
    } else if (isSearchSuggestion) {
      // For search suggestions, execute search command directly
      try {
        // Execute search command directly
        const {executeCommand} = await import('../commands/registry');
        const ctx = {
          history,
          setHistory,
          input: currentInput,
          setInput: setCurrentInput,
          commandHistory,
          setCommandHistory,
          setHistoryIndex
        };

        await executeCommand('search', [completion], ctx);

        // Clear input and show in terminal
        const terminal = xtermRef.current;
        if (terminal) {
          terminal.writeln(`$ search ${completion}`);
          terminal.writeln('');
          terminal.write(`\x1b[32mSearching for: "${completion}"\x1b[0m`);
          terminal.writeln('');
        }

        // Update history
        setHistory(prev => [...prev, {
          command: `search ${completion}`,
          output: `Searching for: "${completion}"`,
          type: 'success'
        }]);

        // Update command history
        setCommandHistory(prev => [...prev, `search ${completion}`]);
        setHistoryIndex(-1);
      } catch (error) {
        console.error('Failed to execute search:', error);
        // Fall back to normal completion behavior
        const newInput = activeResult.originalInput.substring(0, activeResult.replaceStart) +
          completion +
          activeResult.originalInput.substring(activeResult.replaceEnd);
        setCurrentInput(newInput);
        inputRef.current.value = newInput;
      }
    } else {
      // Normal completion behavior for commands, files, etc.
      const newInput = activeResult.originalInput.substring(0, activeResult.replaceStart) +
        completion +
        activeResult.originalInput.substring(activeResult.replaceEnd);

      setCurrentInput(newInput);
      inputRef.current.value = newInput;

      // Set cursor position after the completion
      const newCursorPos = activeResult.replaceStart + completion.length;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current?.focus();
      }, 0);
    }

    // Hide both types of completions
    setShowCompletions(false);
    setCompletionResult(null);
    setShowLiveSuggestions(false);
    setLiveSuggestionResult(null);
  }, [completionResult, liveSuggestionResult, showCompletions, history, setHistory, currentInput, setCurrentInput, commandHistory, setCommandHistory, setHistoryIndex]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    // Handle Tab for autocomplete (disabled in chat mode)
    if (e.key === 'Tab' && !isInChatMode) {
      e.preventDefault();
      if (showCompletions && completionResult) {
        // Navigate through completions
        if (e.shiftKey) {
          // Shift+Tab - previous completion
          const newIndex = selectedCompletionIndex > 0
            ? selectedCompletionIndex - 1
            : completionResult.completions.length - 1;
          setSelectedCompletionIndex(newIndex);
        } else {
          // Tab - next completion or select current
          if (selectedCompletionIndex < completionResult.completions.length - 1) {
            setSelectedCompletionIndex(selectedCompletionIndex + 1);
          } else {
            // Select the current completion
            handleCompletionSelect(completionResult.completions[selectedCompletionIndex], selectedCompletionIndex);
          }
        }
      } else {
        // Start autocomplete
        handleTabCompletion();
      }
      return;
    }

    // Handle Enter first (highest priority)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();

      // If completions are shown and not in chat mode, select completion
      const activeCompletions = showCompletions ? completionResult : (showLiveSuggestions ? liveSuggestionResult : null);
      if ((showCompletions || showLiveSuggestions) && activeCompletions && !isInChatMode) {
        handleCompletionSelect(activeCompletions.completions[selectedCompletionIndex], selectedCompletionIndex);
        return;
      }

      // Otherwise, execute command or send chat message
      if (isInChatMode) {
        handleChatMessage(currentInput);
      } else {
        handleExecuteCommand(currentInput);
      }
      return;
    }

    // Hide completions on most key presses (but not in chat mode)
    if (!isInChatMode && showCompletions && !['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      setShowCompletions(false);
      setCompletionResult(null);
    }

    // Hide live suggestions on certain key presses (but not in chat mode)
    if (!isInChatMode && showLiveSuggestions && ['Escape'].includes(e.key)) {
      setShowLiveSuggestions(false);
      setLiveSuggestionResult(null);
    }

    // Handle completion navigation (works for both Tab completions and live suggestions, but not in chat mode)
    const activeCompletions = showCompletions ? completionResult : (showLiveSuggestions ? liveSuggestionResult : null);
    if (!isInChatMode && (showCompletions || showLiveSuggestions) && activeCompletions) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = selectedCompletionIndex > 0
          ? selectedCompletionIndex - 1
          : activeCompletions.completions.length - 1;
        setSelectedCompletionIndex(newIndex);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = selectedCompletionIndex < activeCompletions.completions.length - 1
          ? selectedCompletionIndex + 1
          : 0;
        setSelectedCompletionIndex(newIndex);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCompletions(false);
        setCompletionResult(null);
        setShowLiveSuggestions(false);
        setLiveSuggestionResult(null);
        return;
      }
    }

    // Handle Ctrl+C
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      terminal.writeln('^C');
      setCurrentInput('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setShowCompletions(false);
      setCompletionResult(null);
      setShowLiveSuggestions(false);
      setLiveSuggestionResult(null);
      return;
    }

    // Handle Up/Down arrows for command history (only if no completions are shown)
    if (e.key === 'ArrowUp' && !showCompletions && !showLiveSuggestions) {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        const command = commandHistory[newIndex];
        setCurrentInput(command);
        if (inputRef.current) {
          inputRef.current.value = command;
        }
        // Hide live suggestions when navigating history
        setShowLiveSuggestions(false);
        setLiveSuggestionResult(null);
      }
      return;
    }

    if (e.key === 'ArrowDown' && !showCompletions && !showLiveSuggestions) {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } else {
          setHistoryIndex(newIndex);
          const command = commandHistory[newIndex];
          setCurrentInput(command);
          if (inputRef.current) {
            inputRef.current.value = command;
          }
        }
        // Hide live suggestions when navigating history
        setShowLiveSuggestions(false);
        setLiveSuggestionResult(null);
      }
      return;
    }
  }, [currentInput, commandHistory, historyIndex, handleExecuteCommand, handleChatMessage, isComposing, showCompletions, completionResult, selectedCompletionIndex, handleTabCompletion, handleCompletionSelect, showLiveSuggestions, liveSuggestionResult, isInChatMode]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isComposing) {
      const newValue = e.target.value;
      setCurrentInput(newValue);

      // Hide Tab completions when input changes (only in command mode)
      if (!isInChatMode && showCompletions) {
        setShowCompletions(false);
        setCompletionResult(null);
      }

      // Trigger live suggestions (only in command mode)
      if (!isInChatMode) {
        handleLiveSuggestions(newValue);
      }
    }
  }, [isComposing, showCompletions, handleLiveSuggestions, isInChatMode]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    setCurrentInput(e.currentTarget.value);
  }, []);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 0);
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [handleResize]);

  // Handle window resize for main terminal
  useEffect(() => {
    if (!applyGlobalTheme) return; // Only for main terminal

    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [applyGlobalTheme]);

  const handleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cleanup live suggestions timeout on unmount
  useEffect(() => {
    return () => {
      if (liveSuggestionsTimeoutRef.current) {
        clearTimeout(liveSuggestionsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`terminal ${className}`}
      style={{
        height: '100%',
        width: '100%',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...style
      }}
    >
      <div
        className={'terminal-bg'}
        style={{
          backgroundColor: 'var(--terminal-bg)',
          opacity: 1 - brightness,
          backdropFilter: `blur(${blur}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      <div
        ref={terminalRef}
        onClick={handleClick}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          padding: 8,
          zIndex: 1,
          backdropFilter: `blur(${blur}px)`
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          backgroundColor: currentTheme.colors.info || '#0087ff',
          color: currentTheme.colors.background,
          fontSize: '12px',
          fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
          fontWeight: 'normal',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <div
          style={{
            backgroundColor: currentTheme.colors.success || '#00af00',
            color: currentTheme.colors.background,
            padding: '0 12px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          NORMAL
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '0',
              width: '0',
              height: '0',
              borderLeft: `12px solid ${currentTheme.colors.success || '#00af00'}`,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent'
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: currentTheme.colors.info || '#0087ff',
            padding: '0 12px 0 18px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          ~/terminal
          {/* Arrow separator */}
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '0',
              width: '0',
              height: '0',
              borderLeft: `12px solid ${currentTheme.colors.info || '#0087ff'}`,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent'
            }}
          />
        </div>

        <div style={{flex: 1}}/>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.textDim || '#666666',
              color: currentTheme.colors.background,
              padding: '0 12px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-6px',
                top: '0',
                width: '0',
                height: '0',
                borderRight: `12px solid ${currentTheme.colors.textDim || '#666666'}`,
                borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent'
              }}
            />
            {commandHistory.length} cmds
          </div>
          <div
            style={{
              backgroundColor: currentTheme.colors.warning || '#ffaf00',
              color: currentTheme.colors.background,
              padding: '0 12px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-6px',
                top: '0',
                width: '0',
                height: '0',
                borderRight: `12px solid ${currentTheme.colors.warning || '#ffaf00'}`,
                borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent'
              }}
            />
            {currentThemeName}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: currentTheme.colors.background,
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <span
          style={{
            color: isInChatMode ? (currentTheme.colors.info || '#74c0fc') : (currentTheme.colors.success || '#00af00'),
            fontSize: parseInt(currentTheme.typography?.fontSize || '14'),
            fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
            marginRight: '8px',
            userSelect: 'none',
            fontWeight: 'normal'
          }}
        >
          {isInChatMode ? (currentChat ? `[${currentChat.name}]` : '[Chat]') : '$'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: currentTheme.colors.text,
            fontSize: parseInt(currentTheme.typography?.fontSize || '14'),
            fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
            padding: '4px 0'
          }}
          placeholder={isInChatMode ? "Type your message..." : "Type a command..."}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      <CompletionList
        completions={completionResult?.completionsWithTypes || completionResult?.completions || []}
        selectedIndex={selectedCompletionIndex}
        onSelect={handleCompletionSelect}
        position={completionPosition}
        visible={showCompletions && !isInChatMode}
        alignBottom={true}
      />

      <CompletionList
        completions={liveSuggestionResult?.completionsWithTypes || liveSuggestionResult?.completions || []}
        selectedIndex={selectedCompletionIndex}
        onSelect={handleCompletionSelect}
        position={completionPosition}
        visible={showLiveSuggestions && !isInChatMode}
        alignBottom={true}
      />
    </div>
  );
};

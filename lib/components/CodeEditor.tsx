import React, { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-themes';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { useAppSelector } from '../store/hooks';
import { selectCurrentTheme } from '../store/selectors';

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'text';

interface CodeEditorProps {
  value?: string;
  language?: SupportedLanguage;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
  width?: string;
  className?: string;
}

const getLanguageExtension = (language: SupportedLanguage) => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return [javascript({ jsx: true })];
    case 'python':
      return [python()];
    case 'html':
      return [html()];
    case 'css':
      return [css()];
    case 'json':
      return [json()];
    case 'markdown':
      return [markdown()];
    case 'text':
    default:
      return [];
  }
};

const createCustomTheme = (terminalTheme: any) => {
  const isDark = terminalTheme.colors.background === '#000000' ||
                 terminalTheme.colors.background === '#1a1a1a' ||
                 terminalTheme.colors.background === '#0d1117';

  return createTheme({
    theme: isDark ? 'dark' : 'light',
    settings: {
      background: terminalTheme.colors.background,
      foreground: terminalTheme.colors.text,
      caret: terminalTheme.colors.cursor,
      selection: terminalTheme.colors.selectionBackground || `${terminalTheme.colors.accent || terminalTheme.colors.cursor}40`,
      selectionMatch: terminalTheme.colors.selectionBackground || `${terminalTheme.colors.accent || terminalTheme.colors.cursor}40`,
      lineHighlight: `${terminalTheme.colors.selection || terminalTheme.colors.accent || terminalTheme.colors.cursor}20`,
      gutterBackground: terminalTheme.colors.backgroundSecondary || terminalTheme.colors.background,
      gutterForeground: terminalTheme.colors.textDim || terminalTheme.colors.textSecondary || terminalTheme.colors.text,
      fontFamily: terminalTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
    },
    styles: [
      { tag: [t.comment, t.blockComment, t.lineComment], color: isDark ? '#6a9955' : '#008000' },
      { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: isDark ? '#569cd6' : '#0000ff' },
      { tag: [t.string, t.special(t.string)], color: isDark ? '#ce9178' : '#a31515' },
      { tag: [t.number, t.integer, t.float], color: isDark ? '#b5cea8' : '#098658' },
      { tag: [t.bool, t.null, t.atom], color: isDark ? '#569cd6' : '#0000ff' },
      { tag: [t.operator, t.punctuation, t.separator], color: terminalTheme.colors.text },
      { tag: [t.variableName, t.definition(t.variableName)], color: isDark ? '#9cdcfe' : '#001080' },
      { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: isDark ? '#dcdcaa' : '#795e26' },
      { tag: [t.className, t.definition(t.className), t.typeName], color: isDark ? '#4ec9b0' : '#267f99' },
      { tag: [t.propertyName, t.attributeName], color: isDark ? '#9cdcfe' : '#e50000' },
      { tag: [t.tagName, t.angleBracket], color: isDark ? '#569cd6' : '#800000' },
      { tag: [t.bracket, t.paren, t.squareBracket, t.brace], color: terminalTheme.colors.text },
      { tag: [t.regexp], color: isDark ? '#d16969' : '#811f3f' },
      { tag: [t.escape], color: isDark ? '#d7ba7d' : '#ee0000' },
      { tag: [t.link], color: isDark ? '#3794ff' : '#0000ee', textDecoration: 'underline' },
      { tag: [t.heading], color: isDark ? '#569cd6' : '#0000ff', fontWeight: 'bold' },
      { tag: [t.emphasis], fontStyle: 'italic' },
      { tag: [t.strong], fontWeight: 'bold' },
      { tag: [t.strikethrough], textDecoration: 'line-through' },
    ]
  });
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  language = 'text',
  onChange,
  onSave,
  placeholder = 'Start typing...',
  readOnly = false,
  height = '400px',
  width = '100%',
  className = '',
}) => {
  const currentTheme = useAppSelector(selectCurrentTheme);

  const customTheme = useMemo(() => {
    return createCustomTheme(currentTheme);
  }, [currentTheme]);

  const extensions = useMemo(() => {
    const langExtensions = getLanguageExtension(language);

    if (onSave) {
      const saveKeymap = keymap.of([
        {
          key: 'Ctrl-s',
          mac: 'Cmd-s',
          run: () => {
            onSave(value);
            return true;
          },
        },
      ]);
      return [...langExtensions, saveKeymap];
    }

    return langExtensions;
  }, [language, onSave, value]);

  const handleChange = useCallback((val: string) => {
    onChange?.(val);
  }, [onChange]);

  return (
    <div
      className={`code-editor ${className}`}
      style={{
        height,
        width,
        borderRadius: 'var(--terminal-border-radius, 8px)',
        overflow: 'hidden',
        overflowY: 'auto',
        backgroundColor: 'var(--terminal-bg)',
      }}
    >
      <CodeMirror
        value={value}
        height={height}
        theme={customTheme}
        extensions={extensions}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
          tabSize: 2,
        }}
        style={{
          fontSize: currentTheme.typography?.fontSize || '14px',
          fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
        }}
      />
    </div>
  );
};

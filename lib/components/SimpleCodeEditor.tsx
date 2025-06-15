import React, { useRef, useEffect, useState } from 'react';
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

interface SimpleCodeEditorProps {
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

const getSyntaxPatterns = (language: SupportedLanguage) => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return [
        { pattern: /\b(function|const|let|var|if|else|for|while|return|class|import|export)\b/g, className: 'keyword' },
        { pattern: /\/\/.*$/gm, className: 'comment' },
        { pattern: /\/\*[\s\S]*?\*\//g, className: 'comment' },
        { pattern: /"[^"]*"/g, className: 'string' },
        { pattern: /'[^']*'/g, className: 'string' },
        { pattern: /`[^`]*`/g, className: 'string' },
        { pattern: /\b\d+\b/g, className: 'number' },
      ];
    case 'python':
      return [
        { pattern: /\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|lambda|yield)\b/g, className: 'keyword' },
        { pattern: /#.*$/gm, className: 'comment' },
        { pattern: /"[^"]*"/g, className: 'string' },
        { pattern: /'[^']*'/g, className: 'string' },
        { pattern: /"""[\s\S]*?"""/g, className: 'string' },
        { pattern: /\b\d+\b/g, className: 'number' },
      ];
    case 'html':
      return [
        { pattern: /<\/?[^>]+>/g, className: 'tag' },
        { pattern: /<!--[\s\S]*?-->/g, className: 'comment' },
        { pattern: /="[^"]*"/g, className: 'string' },
      ];
    case 'css':
      return [
        { pattern: /[^{}]+(?=\s*{)/g, className: 'selector' },
        { pattern: /\/\*[\s\S]*?\*\//g, className: 'comment' },
        { pattern: /:\s*[^;]+/g, className: 'value' },
        { pattern: /[a-zA-Z-]+(?=\s*:)/g, className: 'property' },
      ];
    case 'json':
      return [
        { pattern: /"[^"]*"(?=\s*:)/g, className: 'key' },
        { pattern: /"[^"]*"(?!\s*:)/g, className: 'string' },
        { pattern: /\b(true|false|null)\b/g, className: 'keyword' },
        { pattern: /\b\d+\.?\d*\b/g, className: 'number' },
      ];
    default:
      return [];
  }
};

export const SimpleCodeEditor: React.FC<SimpleCodeEditorProps> = ({
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(value);
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Update content when value prop changes
  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    if (!highlightRef.current) return;

    const patterns = getSyntaxPatterns(language);
    let highlightedContent = content;

    highlightedContent = highlightedContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    patterns.forEach(({ pattern, className }) => {
      highlightedContent = highlightedContent.replace(pattern, (match) => {
        return `<span class="syntax-${className}">${match}</span>`;
      });
    });

    highlightedContent = highlightedContent.replace(/\n/g, '<br>');

    highlightRef.current.innerHTML = highlightedContent;
  }, [content, language]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+S / Cmd+S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.(content);
      return;
    }

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newValue);
      onChange?.(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const editorStyles: React.CSSProperties = {
    position: 'relative',
    height,
    width,
    borderRadius: 'var(--terminal-border-radius, 8px)',
    overflow: 'hidden',
    backgroundColor: 'var(--terminal-bg)',
    fontFamily: 'var(--terminal-font-family)',
    fontSize: 'var(--terminal-font-size)',
  };

  const textareaStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: '16px',
    border: 'none',
    outline: 'none',
    resize: 'none',
    backgroundColor: 'transparent',
    color: 'transparent',
    caretColor: 'var(--terminal-cursor)',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    zIndex: 2,
  };

  const highlightStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: '16px',
    margin: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--terminal-text)',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflow: 'auto',
    pointerEvents: 'none',
    zIndex: 1,
  };

  return (
    <div className={`simple-code-editor ${className}`} style={editorStyles}>
      <style>{`
        .syntax-keyword { color: var(--terminal-info, #569cd6); font-weight: bold; }
        .syntax-comment { color: var(--terminal-text-dim, #6a9955); font-style: italic; }
        .syntax-string { color: var(--terminal-success, #ce9178); }
        .syntax-number { color: var(--terminal-warning, #b5cea8); }
        .syntax-tag { color: var(--terminal-info, #569cd6); }
        .syntax-selector { color: var(--terminal-accent, #d7ba7d); }
        .syntax-property { color: var(--terminal-info, #9cdcfe); }
        .syntax-value { color: var(--terminal-success, #ce9178); }
        .syntax-key { color: var(--terminal-accent, #9cdcfe); }
      `}</style>

      <div ref={highlightRef} style={highlightStyles} />

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        style={textareaStyles}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};

import React, {useCallback, useState} from 'react';
import {CodeEditor, SupportedLanguage} from './CodeEditor';
import {SimpleCodeEditor} from './SimpleCodeEditor';
import {useAppSelector} from '../store/hooks';
import {selectCurrentTheme} from '../store/selectors';

interface CodeEditorContentProps {
  initialContent?: string;
  initialLanguage?: SupportedLanguage;
  filename?: string;
  onFilenameChange?: (filename: string) => void;
  onContentChange?: (content: string) => void;
  onSave?: (content: string, filename: string) => void;
}

export const CodeEditorContent: React.FC<CodeEditorContentProps> = ({
                                                                      initialContent = '',
                                                                      initialLanguage = 'text',
                                                                      filename = 'untitled.txt',
                                                                      onFilenameChange,
                                                                      onContentChange,
                                                                      onSave,
                                                                    }) => {
  const [content, setContent] = useState(initialContent);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [currentFilename, setCurrentFilename] = useState(filename);
  const [isModified, setIsModified] = useState(false);
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);

  const currentTheme = useAppSelector(selectCurrentTheme);

  React.useEffect(() => {
    const extension = currentFilename.split('.').pop()?.toLowerCase();
    let detectedLanguage: SupportedLanguage = 'text';

    switch (extension) {
      case 'js':
      case 'jsx':
        detectedLanguage = 'javascript';
        break;
      case 'ts':
      case 'tsx':
        detectedLanguage = 'typescript';
        break;
      case 'py':
        detectedLanguage = 'python';
        break;
      case 'html':
      case 'htm':
        detectedLanguage = 'html';
        break;
      case 'css':
        detectedLanguage = 'css';
        break;
      case 'json':
        detectedLanguage = 'json';
        break;
      case 'md':
      case 'markdown':
        detectedLanguage = 'markdown';
        break;
      default:
        detectedLanguage = 'text';
    }

    setLanguage(detectedLanguage);
  }, [currentFilename]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsModified(newContent !== initialContent);
    onContentChange?.(newContent);
  }, [initialContent, onContentChange]);

  // Handle filename changes
  const handleFilenameChange = useCallback((newFilename: string) => {
    setCurrentFilename(newFilename);
    onFilenameChange?.(newFilename);
  }, [onFilenameChange]);

  const handleSave = useCallback((contentToSave: string) => {
    if (onSave) {
      onSave(contentToSave, currentFilename);
    } else {
      navigator.clipboard.writeText(contentToSave).then(() => {
        const notification = document.createElement('div');
        notification.textContent = `Saved ${currentFilename} to clipboard!`;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--terminal-success);
          color: var(--terminal-bg);
          padding: 12px 16px;
          border-radius: 6px;
          font-family: var(--terminal-font-family);
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);

        setIsModified(false);
      }).catch(() => {
        console.error('Failed to save to clipboard');
      });
    }
  }, [currentFilename, onSave]);

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      {/* Editor Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--terminal-bg-secondary, var(--terminal-bg))',
          flexShrink: 0
        }}
      >
        <input
          type="text"
          value={currentFilename}
          onChange={(e) => handleFilenameChange(e.target.value)}
          style={{
            background: 'var(--terminal-bg)',
            border: `1px solid var(--terminal-border, #333)`,
            color: 'var(--terminal-text)',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'inherit',
            outline: 'none',
            padding: '6px 8px',
            borderRadius: '4px',
            minWidth: '150px'
          }}
        />

        {isModified && (
          <span
            style={{
              color: 'var(--terminal-warning)',
              fontSize: '12px'
            }}
          >
            ●
          </span>
        )}

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          style={{
            background: 'var(--terminal-bg)',
            border: `1px solid var(--terminal-border, #333)`,
            color: 'var(--terminal-text)',
            fontSize: '12px',
            padding: '6px 8px',
            borderRadius: '4px',
            fontFamily: 'inherit'
          }}
        >
          <option value="text">Text</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
        </select>

        <button
          onClick={() => setUseSimpleEditor(!useSimpleEditor)}
          style={{
            background: 'var(--terminal-bg-secondary)',
            border: `1px solid var(--terminal-border, #333)`,
            color: 'var(--terminal-text)',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500
          }}
          title={useSimpleEditor ? 'Switch to Advanced Editor' : 'Switch to Simple Editor'}
        >
          {useSimpleEditor ? 'Advanced' : 'Simple'}
        </button>

        <button
          onClick={() => handleSave(content)}
          style={{
            background: 'var(--terminal-success)',
            border: 'none',
            color: 'var(--terminal-bg)',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500
          }}
          title="Save (Ctrl+S)"
        >
          Save
        </button>
      </div>

      {/* Editor */}
      <div style={{flex: 1, minHeight: 0}}>
        {useSimpleEditor ? (
          <SimpleCodeEditor
            value={content}
            language={language}
            onChange={handleContentChange}
            onSave={handleSave}
            height="100%"
            width="100%"
          />
        ) : (
          <CodeEditor
            value={content}
            language={language}
            onChange={handleContentChange}
            onSave={handleSave}
            height="100%"
            width="100%"
          />
        )}
      </div>
    </div>
  );
};

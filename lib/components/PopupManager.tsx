import React from 'react';
import {Popup} from './Popup';
import {Terminal} from './Terminal';
import {CodeEditorContent} from './CodeEditorContent';
import type {SupportedLanguage} from './CodeEditor';
import { fileSystem } from '../services/filesystem';

export type PopupType = 'terminal' | 'editor' | 'editor-demo' | 'calculator';

export interface BasePopupData {
  id: string;
  type: PopupType;
}

export interface TerminalPopupData extends BasePopupData {
  type: 'terminal';
  welcomeMessage?: string;
}

export interface EditorPopupData extends BasePopupData {
  type: 'editor';
  filename?: string;
  language?: SupportedLanguage;
  content?: string;
  isNewFile?: boolean;
  useFileSystem?: boolean;
}

export interface EditorDemoPopupData extends BasePopupData {
  type: 'editor-demo';
}

export interface CalculatorPopupData extends BasePopupData {
  type: 'calculator';
}

export type PopupData = TerminalPopupData | EditorPopupData | EditorDemoPopupData | CalculatorPopupData;

interface PopupManagerProps {
  popups: PopupData[];
  onClosePopup: (id: string) => void;
}

export const PopupManager: React.FC<PopupManagerProps> = ({popups, onClosePopup}) => {
  const renderPopupContent = (popup: PopupData) => {
    switch (popup.type) {
      case 'terminal':
        return (
          <Terminal
            onClose={() => onClosePopup(popup.id)}
            welcomeMessage={popup.welcomeMessage || 'Terminal Popup - Type "help" for available commands.'}
          />
        );

      case 'editor':
        return (
          <CodeEditorContent
            initialContent={popup.content || ''}
            initialLanguage={popup.language || 'text'}
            filename={popup.filename || 'untitled.txt'}
            onSave={async (content, filename) => {
              if (popup.useFileSystem) {
                // Save to file system
                try {
                  await fileSystem.initialize();
                  await fileSystem.writeFile(filename, content, false);

                  // Show success notification
                  const notification = document.createElement('div');
                  notification.textContent = `Saved ${filename} to file system!`;
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
                } catch (error) {
                  // Show error notification
                  const notification = document.createElement('div');
                  notification.textContent = `Error saving ${filename}: ${error}`;
                  notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--terminal-error);
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
                  }, 5000);
                }
              } else {
                // Default save behavior - copy to clipboard
                navigator.clipboard.writeText(content).then(() => {
                  const notification = document.createElement('div');
                  notification.textContent = `Saved ${filename} to clipboard!`;
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
                });
              }
            }}
          />
        );

      default:
        return <div>Unknown popup type</div>;
    }
  };

  const getPopupTitle = (popup: PopupData): string => {
    switch (popup.type) {
      case 'terminal':
        return 'Terminal';
      case 'editor':
        return popup.filename || 'Code Editor';
      case 'editor-demo':
        return 'Code Editor Demo';
      case 'calculator':
        return 'Calculator';
      default:
        return 'Popup';
    }
  };

  const getPopupDimensions = (popup: PopupData) => {
    switch (popup.type) {
      case 'terminal':
        return {
          initialWidth: 800,
          initialHeight: 500,
          minWidth: 400,
          minHeight: 300
        };
      case 'editor':
        return {
          initialWidth: 900,
          initialHeight: 600,
          minWidth: 600,
          minHeight: 400
        };
      case 'editor-demo':
        return {
          initialWidth: 1000,
          initialHeight: 700,
          minWidth: 800,
          minHeight: 600
        };
      case 'calculator':
        return {
          initialWidth: 400,
          initialHeight: 500,
          minWidth: 350,
          minHeight: 450
        };
      default:
        return {
          initialWidth: 800,
          initialHeight: 500,
          minWidth: 400,
          minHeight: 300
        };
    }
  };

  return (
    <>
      {popups.map(popup => {
        const dimensions = getPopupDimensions(popup);
        return (
          <Popup
            key={popup.id}
            title={getPopupTitle(popup)}
            onClose={() => onClosePopup(popup.id)}
            {...dimensions}
            className={`popup-${popup.type}`}
          >
            {renderPopupContent(popup)}
          </Popup>
        );
      })}
    </>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Terminal } from '../../lib/components/Terminal';
import { type PopupData, PopupManager } from '../../lib/components/PopupManager';
import {defaultWelcomeMessage} from "@/lib/config/app.ts";

const TerminalApp: React.FC = () => {
  const [popups, setPopups] = useState<PopupData[]>([]);



  useEffect(() => {
    const handleOpenTerminalPopup = () => {
      const newPopup: PopupData = {
        id: Date.now().toString(),
        type: 'terminal'
      };
      setPopups(prev => [...prev, newPopup]);
    };

    const handleOpenCodeEditor = (event: CustomEvent) => {
      const {filename, language, content, isNewFile, useFileSystem} = event.detail;
      const newPopup: PopupData = {
        id: Date.now().toString(),
        type: 'editor',
        filename: filename || 'untitled.txt',
        language: language || 'text',
        content: content || '',
        isNewFile: isNewFile || false,
        useFileSystem: useFileSystem || false
      };
      setPopups(prev => [...prev, newPopup]);
    };

    const handleOpenCodeEditorDemo = () => {
      const newPopup: PopupData = {
        id: Date.now().toString(),
        type: 'editor-demo'
      };
      setPopups(prev => [...prev, newPopup]);
    };

    window.addEventListener('openTerminalPopup', handleOpenTerminalPopup);
    window.addEventListener('openCodeEditor', handleOpenCodeEditor as EventListener);
    window.addEventListener('openCodeEditorDemo', handleOpenCodeEditorDemo);
    return () => {
      window.removeEventListener('openTerminalPopup', handleOpenTerminalPopup);
      window.removeEventListener('openCodeEditor', handleOpenCodeEditor as EventListener);
      window.removeEventListener('openCodeEditorDemo', handleOpenCodeEditorDemo);
    };
  }, []);

  const handleClosePopup = useCallback((popupId: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== popupId));
  }, []);

  return (
    <div style={{position: 'relative', height: '100vh', width: '100vw'}}>
      <Terminal
        welcomeMessage={defaultWelcomeMessage}
        applyGlobalTheme={true}
        exposeGlobalContext={true}
        style={{
          height: '100%',
          width: '100%'
        }}
      />

      <PopupManager
        popups={popups}
        onClosePopup={handleClosePopup}
      />
    </div>
  );
};

const TerminalNewTab: React.FC = () => {
  return <TerminalApp/>;
};

export default TerminalNewTab;

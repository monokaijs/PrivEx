import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentTheme } from '../store/selectors';

export interface CompletionListProps {
  completions: string[];
  selectedIndex: number;
  onSelect: (completion: string, index: number) => void;
  position: { x: number; y: number };
  visible: boolean;
}

export const CompletionList: React.FC<CompletionListProps> = ({
  completions,
  selectedIndex,
  onSelect,
  position,
  visible
}) => {
  const currentTheme = useAppSelector(selectCurrentTheme);

  if (!visible || completions.length === 0) {
    return null;
  }

  // Limit the number of visible completions
  const maxVisible = 10;
  const visibleCompletions = completions.slice(0, maxVisible);
  const hasMore = completions.length > maxVisible;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: currentTheme.colors.backgroundSecondary || currentTheme.colors.background,
        border: `1px solid ${currentTheme.colors.border || currentTheme.colors.text}`,
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'hidden',
        fontFamily: currentTheme.typography?.fontFamily || 'JetBrains Mono, monospace',
        fontSize: currentTheme.typography?.fontSize || '14px'
      }}
    >
      {visibleCompletions.map((completion, index) => (
        <div
          key={index}
          onClick={() => onSelect(completion, index)}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex 
              ? currentTheme.colors.accent || currentTheme.colors.text
              : 'transparent',
            color: index === selectedIndex 
              ? currentTheme.colors.background
              : currentTheme.colors.text,
            borderBottom: index < visibleCompletions.length - 1 
              ? `1px solid ${currentTheme.colors.textDim || currentTheme.colors.border}` 
              : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={() => {
            // Optional: Update selected index on hover
          }}
        >
          {completion}
        </div>
      ))}
      
      {hasMore && (
        <div
          style={{
            padding: '6px 12px',
            color: currentTheme.colors.textDim || currentTheme.colors.textSecondary,
            fontStyle: 'italic',
            borderTop: `1px solid ${currentTheme.colors.textDim || currentTheme.colors.border}`,
            backgroundColor: currentTheme.colors.backgroundSecondary || currentTheme.colors.background
          }}
        >
          ... and {completions.length - maxVisible} more
        </div>
      )}
    </div>
  );
};

export default CompletionList;

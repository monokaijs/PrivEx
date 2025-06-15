import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentTheme } from '../store/selectors';
import type { CompletionWithType } from '../services/autocomplete-providers';

export interface CompletionListProps {
  completions: string[] | CompletionWithType[];
  selectedIndex: number;
  onSelect: (completion: string, index: number) => void;
  position: { x: number; y: number };
  visible: boolean;
  alignBottom?: boolean; // New prop to control bottom alignment
}

export const CompletionList: React.FC<CompletionListProps> = ({
  completions,
  selectedIndex,
  onSelect,
  position,
  visible,
  alignBottom = false
}) => {
  const currentTheme = useAppSelector(selectCurrentTheme);
  const listRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Helper functions
  const isCompletionWithType = (completion: any): completion is CompletionWithType => {
    return typeof completion === 'object' && completion.value && completion.type;
  };

  const getCompletionValue = (completion: string | CompletionWithType): string => {
    return isCompletionWithType(completion) ? completion.value : completion;
  };

  const getCompletionType = (completion: string | CompletionWithType): CompletionWithType['type'] | null => {
    return isCompletionWithType(completion) ? completion.type : null;
  };

  const getTypeIcon = (type: CompletionWithType['type'] | null): string => {
    switch (type) {
      case 'command': return '⚡';
      case 'domain': return '🌐';
      case 'file': return '📁';
      case 'theme': return '🎨';
      case 'config': return '⚙️';
      case 'url': return '🔗';
      default: return '';
    }
  };

  const getTypeColor = (type: CompletionWithType['type'] | null): string => {
    switch (type) {
      case 'command': return currentTheme.colors.success || '#00af00';
      case 'domain': return currentTheme.colors.info || '#0087ff';
      case 'file': return currentTheme.colors.warning || '#ffaf00';
      case 'theme': return currentTheme.colors.accent || '#ff5f87';
      case 'config': return currentTheme.colors.textDim || '#666666';
      case 'url': return currentTheme.colors.info || '#0087ff';
      default: return currentTheme.colors.text;
    }
  };

  // Limit the number of visible completions
  const maxVisible = 10;
  const visibleCompletions = completions.slice(0, maxVisible);
  const hasMore = completions.length > maxVisible;

  // Calculate dynamic position for bottom alignment
  useEffect(() => {
    if (alignBottom && listRef.current && visible) {
      const listHeight = listRef.current.offsetHeight;
      setAdjustedPosition({
        x: position.x,
        y: position.y - listHeight
      });
    } else {
      setAdjustedPosition(position);
    }
  }, [alignBottom, position, visible, completions.length]);

  if (!visible || completions.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
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
      {visibleCompletions.map((completion, index) => {
        const value = getCompletionValue(completion);
        const type = getCompletionType(completion);
        const icon = getTypeIcon(type);
        const typeColor = getTypeColor(type);

        return (
          <div
            key={index}
            onClick={() => onSelect(value, index)}
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
              transition: 'background-color 0.1s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={() => {
              // Optional: Update selected index on hover
            }}
          >
            {icon && (
              <span
                style={{
                  fontSize: '14px',
                  color: index === selectedIndex ? currentTheme.colors.background : typeColor,
                  flexShrink: 0
                }}
              >
                {icon}
              </span>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value}
            </span>
            {type && type !== 'command' && (
              <span
                style={{
                  fontSize: '11px',
                  color: index === selectedIndex
                    ? currentTheme.colors.background
                    : currentTheme.colors.textDim || currentTheme.colors.textSecondary,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  opacity: 0.7
                }}
              >
                {type}
              </span>
            )}
          </div>
        );
      })}
      
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

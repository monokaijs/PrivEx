import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentTheme } from '../store/selectors';

export interface PopupProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  className?: string;
  headerActions?: ReactNode;
}

export const Popup: React.FC<PopupProps> = ({
  title,
  onClose,
  children,
  initialWidth = 800,
  initialHeight = 500,
  minWidth = 400,
  minHeight = 300,
  resizable = true,
  className = '',
  headerActions,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const popupRef = useRef<HTMLDivElement>(null);
  const currentTheme = useAppSelector(selectCurrentTheme);

  useEffect(() => {
    setPosition({
      x: (window.innerWidth - size.width) / 2,
      y: (window.innerHeight - size.height) / 2
    });
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className={`popup ${className}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: 'var(--terminal-bg)',
        border: `2px solid var(--terminal-border, ${currentTheme.colors.border || '#333'})`,
        borderRadius: 'var(--terminal-border-radius, 8px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        fontFamily: 'var(--terminal-font-family)',
        overflow: 'hidden',
        resize: resizable ? 'both' : 'none',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: 'var(--terminal-bg-secondary, var(--terminal-bg))',
          height: '40px',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid var(--terminal-border, ${currentTheme.colors.border || '#333'})`,
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        <span
          style={{
            color: 'var(--terminal-text)',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {headerActions}
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--terminal-text)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--terminal-error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

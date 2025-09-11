/**
 * ChatHeader Component
 * Header with title and action buttons
 */

import React from 'react';

export interface ChatHeaderProps {
  onClose: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHistory?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  onUndo,
  onRedo,
  onHistory
}) => {
  return (
    <div className="peekberry-chat-header">
      <div className="peekberry-chat-title">Peekberry AI</div>
      <div className="peekberry-header-actions">
        <button 
          className="peekberry-undo-btn" 
          type="button" 
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="peekberry-redo-btn" 
          type="button" 
          title="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="peekberry-history-btn" 
          type="button" 
          title="View History"
          onClick={onHistory}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="peekberry-close-btn" 
          type="button" 
          title="Close Chat"
          onClick={onClose}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;

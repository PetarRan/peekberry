/**
 * ChatMessage Component
 * Individual chat message display
 */

import React from 'react';

export interface ChatMessageProps {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  timestamp
}) => {
  return (
    <div className={`peekberry-message peekberry-message-${type}`}>
      <div className="peekberry-message-content">{content}</div>
      <div className="peekberry-message-time">
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ChatMessage;

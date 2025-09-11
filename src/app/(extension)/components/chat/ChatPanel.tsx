/**
 * ChatPanel React Component
 * Handles the chat interface for Peekberry extension
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { SelectedElementsList, SelectedElement } from './SelectedElementsList';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

export type { SelectedElement } from './SelectedElementsList';

export interface ChatPanelProps {
  selectedElements: SelectedElement[];
  onElementRemove: (index: number) => void;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  selectedElements,
  onElementRemove,
  onSendMessage,
  onClose,
  isVisible
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    onSendMessage(message);
  };

  if (!isVisible) return null;

  return (
    <div className="peekberry-chat-panel">
      {/* Drag Handler */}
      <div className="peekberry-drag-handler">
        <div className="peekberry-drag-dots">
          <div className="peekberry-drag-dot"></div>
          <div className="peekberry-drag-dot"></div>
          <div className="peekberry-drag-dot"></div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="peekberry-chat-messages">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            id={message.id}
            type={message.type}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Elements - Horizontal Scrollable at Bottom */}
      <SelectedElementsList 
        elements={selectedElements}
        onElementRemove={onElementRemove}
      />

      {/* Chat Input */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        placeholder="Describe what you'd like to change..."
      />
    </div>
  );
};

export default ChatPanel;

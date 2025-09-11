/**
 * ChatInput Component
 * Input field for sending messages
 */

import React, { useState } from 'react';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Describe what you'd like to change...",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="peekberry-chat-input-container">
      {/* Main Input Area */}
      <div className="peekberry-input-wrapper">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="peekberry-input-field"
          rows={2}
          disabled={disabled}
        />
        <div className="peekberry-input-actions">
          <button className="peekberry-more-btn" title="More options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="19" cy="12" r="1" fill="currentColor"/>
              <circle cx="5" cy="12" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Controls Row */}
      <div className="peekberry-controls-row">
        {/* Left Side - Settings, History, Export */}
        <div className="peekberry-controls-left">
          <button className="peekberry-control-btn" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="peekberry-control-btn" title="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="peekberry-control-btn" title="Export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Right Side - Model, Voice, Save, Apply */}
        <div className="peekberry-controls-right">
          {/* Model Selection */}
          <div className="peekberry-model-selector">
            <select className="peekberry-model-dropdown">
              <option value="claude">Claude-4</option>
              <option value="gpt">GPT-4</option>
            </select>
          </div>

          {/* Voice Mode */}
          <button className="peekberry-control-btn" title="Voice Mode">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 003 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" stroke="currentColor" strokeWidth="2"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          {/* Save/Screenshot */}
          <button className="peekberry-control-btn" title="Save Screenshot">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          {/* Apply Button */}
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || disabled}
            className="peekberry-apply-btn"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

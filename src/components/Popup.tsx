import { useState, useRef, useEffect } from "react";
import { Box } from "@mui/material";
import type { SelectedElement } from "../hooks/useElementSelection";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { ChatInput } from "./ChatInput";
import { ControlBar } from "./ControlBar";
import { SelectedElementsDisplay } from "./SelectedElementsDisplay";
import { saveScreenshotToSupabase } from "../utils/screenshot";

interface PopupProps {
  selectedElements: SelectedElement[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRemoveSelection: (index: number) => void;
  onClearSelections: () => void;
  onSendToLLM: (prompt: string) => void;
  isLoading: boolean;
}

export const Popup = ({
  selectedElements,
  onMouseEnter,
  onMouseLeave,
  onRemoveSelection,
  onSendToLLM,
  isLoading,
}: PopupProps) => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const textFieldRef = useRef<HTMLInputElement>(null);
  const { isRecording, isProcessing, startRecording, stopRecording, error } =
    useSpeechToText();

  const handleSendToLLM = () => {
    onSendToLLM(prompt);
    setPrompt("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      selectedElements.length > 0 &&
      prompt.trim() &&
      !isLoading
    ) {
      handleSendToLLM();
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording and get transcription
      const transcription = await stopRecording();
      if (transcription) {
        setPrompt((prev) => prev + (prev ? " " : "") + transcription);
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const handleScreenshot = async () => {
    try {
      const success = await saveScreenshotToSupabase({
        selectedElements: selectedElements.map(el => el.selector),
        prompt,
        model: selectedModel,
      });
      
      if (success) {
        console.log("Screenshot saved successfully");
        // You could add a toast notification here
      } else {
        console.error("Failed to save screenshot");
      }
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  };

  // Auto-focus the TextField when elements are selected
  useEffect(() => {
    if (selectedElements.length > 0 && textFieldRef.current) {
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
      }, 100);
    }
  }, [selectedElements.length]);

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error("Speech-to-text error:", error);
    }
  }, [error]);

  return (
    <Box
      data-peek-ui="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        position: "fixed",
        bottom: "70px",
        right: "20px",
        width: "500px",
        backgroundColor: "#1a1a1a",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        zIndex: 100001,
        overflow: "hidden",
      }}
    >
      {/* Selected Elements Display */}
      <SelectedElementsDisplay
        selectedElements={selectedElements}
        onRemoveSelection={onRemoveSelection}
      />

      {/* Chat Input */}
      <Box sx={{ padding: "16px" }}>
        <ChatInput
          value={prompt}
          onChange={setPrompt}
          onKeyPress={handleKeyPress}
          isProcessing={isProcessing}
          disabled={selectedElements.length === 0}
          hasSelectedElements={selectedElements.length > 0}
        />
      </Box>

      {/* Control Bar */}
      <ControlBar
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onVoiceRecording={handleVoiceRecording}
        onScreenshot={handleScreenshot}
        onApply={handleSendToLLM}
        isRecording={isRecording}
        isProcessing={isProcessing}
        isLoading={isLoading}
        disabled={selectedElements.length === 0 || !prompt.trim()}
      />
    </Box>
  );
};

import { useState, useRef, useEffect } from "react";
import {
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectedElement } from "../hooks/useElementSelection";
import { useSpeechToText } from "../hooks/useSpeechToText";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

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
    <Card
      data-peek-ui="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        position: "fixed",
        bottom: "70px",
        right: "20px",
        width: "500px",
        padding: "10px",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
        border: "2px solid rgba(0, 0, 0, 0.05)",
        borderRadius: "12px",
        zIndex: 100001,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {selectedElements.length === 0
            ? "Click elements to select them"
            : `Selected: ${selectedElements.length} element(s)`}
        </Typography>

        {selectedElements.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedElements.map((item, index) => (
              <Chip
                key={index}
                label={`${index + 1}: ${
                  item.selector.length > 20
                    ? item.selector.slice(0, 20) + "..."
                    : item.selector
                }`}
                size="small"
                onDelete={() => onRemoveSelection(index)}
                sx={{ marginBottom: 1 }}
              />
            ))}
          </Stack>
        )}

        <TextField
          inputRef={textFieldRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isProcessing ? "Processing speech..." : "Prompt text"}
          style={{ width: "100%", marginTop: "5px" }}
          disabled={isProcessing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleVoiceRecording}
                  edge="end"
                  color={isRecording ? "error" : "default"}
                  disabled={isLoading || isProcessing}
                >
                  {isProcessing ? (
                    <CircularProgress size={20} />
                  ) : isRecording ? (
                    <MicOffIcon />
                  ) : (
                    <MicIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleSendToLLM}
            disabled={
              selectedElements.length === 0 || !prompt.trim() || isLoading
            }
            endIcon={
              isLoading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <ChevronRightRoundedIcon />
              )
            }
            sx={{ mt: 1 }}
          >
            Execute
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

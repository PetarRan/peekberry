import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MicIcon from "@mui/icons-material/Mic";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useState } from "react";

interface ControlBarProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onVoiceRecording: () => void;
  onScreenshot: () => void;
  onApply: () => void;
  onShowHistory: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  disabled?: boolean;
}

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { value: "o4-mini", label: "o4 Mini (Reasoning)" },
];

export const ControlBar = ({
  selectedModel,
  onModelChange,
  onVoiceRecording,
  onScreenshot,
  onApply,
  onShowHistory,
  isRecording,
  isProcessing,
  isLoading,
  disabled = false,
}: ControlBarProps) => {
  const [modelMenuAnchor, setModelMenuAnchor] = useState<null | HTMLElement>(null);

  const handleModelMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setModelMenuAnchor(event.currentTarget);
  };

  const handleModelMenuClose = () => {
    setModelMenuAnchor(null);
  };

  const handleModelSelect = (model: string) => {
    onModelChange(model);
    handleModelMenuClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: "0 0 8px 8px",
      }}
    >
      {/* Left side - Settings, History, Export */}
      <Stack direction="row" spacing={1}>
        <IconButton 
          size="small" 
          onClick={onShowHistory}
          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Stack>
      

      {/* Right side - Mic, Camera, Apply */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          onClick={handleModelMenuOpen}
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            color: "white",
            textTransform: "none",
            fontSize: "14px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {OPENAI_MODELS.find((model) => model.value === selectedModel)?.label || "GPT-4o Mini"}
        </Button>

        <Menu
          anchorEl={modelMenuAnchor}
          open={Boolean(modelMenuAnchor)}
          onClose={handleModelMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          MenuListProps={{
            sx: {
              zIndex: 100003,
            },
          }}
          PaperProps={{
            sx: {
              backgroundColor: "#2a2a2a",
              color: "white",
              zIndex: 100003,
              "& .MuiMenuItem-root": {
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              },
            },
          }}
          sx={{
            zIndex: 100003,
          }}
        >
          {OPENAI_MODELS.map((model) => (
            <MenuItem
              key={model.value}
              onClick={() => handleModelSelect(model.value)}
              selected={model.value === selectedModel}
            >
              {model.label}
            </MenuItem>
          ))}
        </Menu>
        <IconButton
          onClick={onVoiceRecording}
          size="small"
          color={isRecording ? "error" : "default"}
          disabled={isLoading || isProcessing}
          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <MicIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={onScreenshot}
          size="small"
          disabled={isLoading}
          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <CameraAltIcon fontSize="small" />
        </IconButton>

        <Button
          onClick={onApply}
          variant="contained"
          disabled={disabled || isLoading}
          sx={{
            backgroundColor: "white",
            color: "black",
            textTransform: "none",
            fontSize: "14px",
            padding: "6px 16px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            },
            "&:disabled": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              color: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          Apply
        </Button>
      </Stack>
    </Box>
  );
};

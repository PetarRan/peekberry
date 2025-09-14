import { TextField } from "@mui/material";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isProcessing: boolean;
  disabled?: boolean;
  hasSelectedElements?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onKeyPress,
  isProcessing,
  disabled = false,
  hasSelectedElements = false,
}: ChatInputProps) => {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder={isProcessing ? "Processing speech..." : (hasSelectedElements ? "Type your message..." : "")}
      disabled={disabled || isProcessing}
      variant="filled"
      fullWidth
      multiline
      minRows={1}
      maxRows={2}
      className="peekberry-chat-input"
      InputProps={{}}
    />
  );
};

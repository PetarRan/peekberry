import { Box, Typography } from "@mui/material";

interface HistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  action: string;
  created_at: string;
}

interface HistoryCardProps {
  item: HistoryItem;
}

export const HistoryCard = ({ item }: HistoryCardProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        },
      }}
    >
      {/* Prompt */}
      <Typography
        variant="body2"
        sx={{
          color: "white",
          fontSize: "14px",
          lineHeight: 1.4,
          marginBottom: "8px",
        }}
      >
        {item.prompt !== "" ? item.prompt : "No prompt"}
      </Typography>

      {/* Action */}
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "12px",
          lineHeight: 1.3,
          marginBottom: "12px",
          fontStyle: "italic",
        }}
      >
        {item.action}
      </Typography>

      {/* Timestamp */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "11px",
          }}
        >
          {formatTimestamp(item.created_at)}
        </Typography>
      </Box>
    </Box>
  );
};

import { Box, Typography, IconButton, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { HistoryCard } from "./HistoryCard";

interface HistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  action: string;
  created_at: string;
}

interface HistoryProps {
  onBack: () => void;
  historyItems: HistoryItem[];
  isLoading: boolean;
}

export const History = ({ onBack, historyItems, isLoading }: HistoryProps) => {
  console.log("historyItems", historyItems);
  return (
    <Box
      data-peek-ui="true"
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
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <IconButton
          onClick={onBack}
          size="small"
          sx={{ 
            color: "white", 
            marginRight: "12px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            color: "white",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          History
        </Typography>
      </Box>

      {/* History List */}
      <Box
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          padding: "16px",
        }}
      >
        {isLoading ? (
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Loading history...
          </Typography>
        ) : historyItems.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No history yet. Start making changes to see them here!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {historyItems.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

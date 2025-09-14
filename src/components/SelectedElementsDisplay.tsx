import { Box, Chip, Typography, Stack } from "@mui/material";
import type { SelectedElement } from "../hooks/useElementSelection";

interface SelectedElementsDisplayProps {
  selectedElements: SelectedElement[];
  onRemoveSelection: (index: number) => void;
}

export const SelectedElementsDisplay = ({
  selectedElements,
  onRemoveSelection,
}: SelectedElementsDisplayProps) => {
  if (selectedElements.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        padding: "12px 16px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px 8px 0 0",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "12px",
          marginBottom: "8px",
        }}
      >
        Selected: {selectedElements.length} element(s)
      </Typography>
      
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
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              "& .MuiChip-deleteIcon": {
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "white",
                },
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

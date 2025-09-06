import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Fab, Tooltip } from "@mui/material";
import theme from "../../theme/theme";

interface FloatingWidgetProps {
  onToggle: (isExpanded: boolean) => void;
  isExpanded: boolean;
}

const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  onToggle,
  isExpanded,
}) => {
  const handleClick = () => {
    onToggle(!isExpanded);
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999999,
          pointerEvents: "auto",
        }}
      >
        <Tooltip title="Peekberry - Click to expand" placement="left">
          <Fab
            onClick={handleClick}
            sx={{
              width: 60,
              height: 60,
              backgroundColor: "#000000",
              color: "white",
              boxShadow:
                "0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                backgroundColor: "#1a1a1a",
                boxShadow:
                  "0 0 25px rgba(0, 0, 0, 0.6), 0 0 50px rgba(99, 102, 241, 0.4)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease-in-out",
              border: "2px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}
            >
              P
            </span>
          </Fab>
        </Tooltip>
      </div>
    </ThemeProvider>
  );
};

export default FloatingWidget;

import { Box } from "@mui/material";

interface FloatingButtonProps {
  onClick: () => void;
}

export const FloatingButton = ({ onClick }: FloatingButtonProps) => {
  return (
    <Box
      onClick={onClick}
      data-peek-ui="true"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        overflow: "hidden",
        background: "#000000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        padding: "10px",
        zIndex: 100001,
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)",
      }}
    >
      <img
        src={chrome.runtime.getURL("peekberry-logo.avif")}
        style={{ width: "100%", height: "100%" }}
        alt="PeekBerry"
      />
    </Box>
  );
};
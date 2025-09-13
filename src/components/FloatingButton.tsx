import { Box } from "@mui/material";

interface FloatingButtonProps {
  onClick: () => void;
}

export const FloatingButton = ({ onClick }: FloatingButtonProps) => {
  return (
    <Box
      onClick={onClick}
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
        zIndex: 100001,
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
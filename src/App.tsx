import { useState } from "react";
import { FloatingButton } from "./components/FloatingButton";
import { Popup } from "./components/Popup";
import { useElementSelection } from "./hooks/useElementSelection";
import { useLLMCommunication } from "./hooks/useLLMCommunication";
import theme from "./theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";

export default function App() {
  const [open, setOpen] = useState(false);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);

  const { selectedElements, clearSelections, removeSelection } =
    useElementSelection(open, isHoveringPopup);

  const { isLoading, sendToLLM } = useLLMCommunication();

  const handleSendToLLM = (prompt: string) => {
    sendToLLM(selectedElements, prompt, () => {
      clearSelections();
    });
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FloatingButton onClick={() => setOpen(!open)} />

        {open && (
          <Popup
            selectedElements={selectedElements}
            onMouseEnter={() => setIsHoveringPopup(true)}
            onMouseLeave={() => setIsHoveringPopup(false)}
            onRemoveSelection={removeSelection}
            onClearSelections={clearSelections}
            onSendToLLM={handleSendToLLM}
            isLoading={isLoading}
          />
        )}
      </ThemeProvider>
    </>
  );
}

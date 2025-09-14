import { useState } from "react";
import { FloatingButton } from "./components/FloatingButton";
import { Popup } from "./components/Popup";
import { History } from "./components/History";
import { useElementSelection } from "./hooks/useElementSelection";
import { useLLMCommunication } from "./hooks/useLLMCommunication";
import { useHistory } from "./hooks/useHistory";
import theme from "./theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";

export default function App() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);

  const { selectedElements, clearSelections, removeSelection } =
    useElementSelection(open, isHoveringPopup);

  const { isLoading, sendToLLM } = useLLMCommunication();
  const { historyItems, isLoading: historyLoading, refetch: refetchHistory } = useHistory();

  const handleSendToLLM = (prompt: string, model: string) => {
    sendToLLM(selectedElements, prompt, () => {
      clearSelections();
    }, model, refetchHistory);
  };

  const handleTogglePopup = () => {
    if (open) {
      // If closing, clear selections and stop element selection
      clearSelections();
    }
    setOpen(!open);
    setShowHistory(false); // Close history when toggling popup
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleBackFromHistory = () => {
    setShowHistory(false);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FloatingButton onClick={handleTogglePopup} />

        {open && !showHistory && (
          <Popup
            selectedElements={selectedElements}
            onMouseEnter={() => setIsHoveringPopup(true)}
            onMouseLeave={() => setIsHoveringPopup(false)}
            onRemoveSelection={removeSelection}
            onClearSelections={clearSelections}
            onSendToLLM={handleSendToLLM}
            onShowHistory={handleShowHistory}
            onRefreshHistory={refetchHistory}
            isLoading={isLoading}
          />
        )}

        {open && showHistory && (
          <History
            onBack={handleBackFromHistory}
            historyItems={historyItems}
            isLoading={historyLoading}
          />
        )}
      </ThemeProvider>
    </>
  );
}

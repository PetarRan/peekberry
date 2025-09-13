import { useState, useEffect } from "react";
import { enableHighlight, disableHighlight } from "../highlight";

export interface SelectedElement {
  selector: string;
  html: string;
  element?: Element;
}

export const useElementSelection = (isActive: boolean, isHoveringPopup: boolean) => {
  const [selector, setSelector] = useState("");
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);

  useEffect(() => {
    if (isActive && !isHoveringPopup) {
      enableHighlight((sel, htmlContent, element) => {
        setSelectedElements((prev) => {
          const exists = prev.some((item) => item.selector === sel);
          if (!exists) {
            return [
              ...prev,
              { selector: sel, html: htmlContent || "", element: element! },
            ];
          }
          return prev;
        });
        setSelector(sel);
      }, false);
    } else {
      disableHighlight();
    }
  }, [isActive, isHoveringPopup]);

  const clearSelections = () => {
    setSelectedElements([]);
    setSelector("");
  };

  const removeSelection = (index: number) => {
    setSelectedElements((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    selector,
    selectedElements,
    clearSelections,
    removeSelection,
  };
};
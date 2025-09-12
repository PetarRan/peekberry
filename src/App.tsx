/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { enableHighlight, disableHighlight } from "./highlight";
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function App() {
  const [open, setOpen] = useState(false);
  const [_selector, setSelector] = useState("");
  const [selectedElements, setSelectedElements] = useState<
    Array<{ selector: string; html: string }>
  >([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);

  useEffect(() => {
    if (open && !isHoveringPopup) {
      enableHighlight((sel, htmlContent, element) => {
        // Add new selection to the array without disabling highlight
        setSelectedElements((prev) => {
          // Check if element is already selected
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
        // Don't disable highlight to allow multiple selections
      }, false); // Pass false to not disable after selection
    } else {
      disableHighlight();
    }
  }, [open, isHoveringPopup]);

  const clearSelections = () => {
    setSelectedElements([]);
    setSelector("");
  };

  const removeSelection = (index: number) => {
    setSelectedElements((prev) => prev.filter((_, i) => i !== index));
  };

  type Instruction = {
    selector: string;
    style?: Record<string, string>;
    text?: string;
  };

  const executeCode = (instructions: Instruction[] | string) => {
    if (
      !instructions ||
      (Array.isArray(instructions) && instructions.length === 0)
    ) {
      console.log("No instructions to execute");
      return;
    }

    // If instructions come as JSON string, parse it
    let parsedInstructions: Instruction[] = [];
    if (typeof instructions === "string") {
      try {
        parsedInstructions = JSON.parse(instructions);
      } catch (err) {
        console.error("Failed to parse instructions JSON:", instructions, err);
        return;
      }
    } else {
      parsedInstructions = instructions;
    }

    try {
      // Check if we're in a Chrome extension context
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]?.id) return;
          const tabId = tabs[0].id;

          chrome.scripting.executeScript(
            {
              target: { tabId },
              func: (instr: Instruction[]) => {
                instr.forEach((ins) => {
                  const el = document.querySelector(ins.selector);
                  if (!el) return;

                  // Only apply styles if el is an HTMLElement
                  if (ins.style && el instanceof HTMLElement) {
                    Object.assign(el.style, ins.style);
                  }

                  // Only set text if el is an HTMLElement
                  if (ins.text !== undefined && el instanceof HTMLElement) {
                    el.textContent = ins.text;
                  }
                });
              },
              args: [parsedInstructions],
            },
            () => {
              console.log("Instructions applied to page DOM");
            }
          );
        });
      } else {
        // Regular web page context
        parsedInstructions.forEach((ins) => {
          const el = document.querySelector(ins.selector);
          if (!el) return;

          // Only apply styles if el is an HTMLElement
          if (ins.style && el instanceof HTMLElement) {
            Object.assign(el.style, ins.style);
          }

          // Only set text if el is an HTMLElement
          if (ins.text !== undefined && el instanceof HTMLElement) {
            el.textContent = ins.text;
          }
        });
        console.log("Instructions applied to page DOM (non-extension)");
      }
    } catch (error) {
      console.error("Error in executeCode:", error);
    }
  };

  const sendToLLM = async () => {
    if (selectedElements.length === 0 || !prompt.trim()) {
      console.log("No elements selected or prompt is empty");
      return;
    }

    setIsLoading(true);
    try {
      // Combine all selected elements' HTML
      const combinedHtml = selectedElements
        .map((item) => item.html)
        .join("\n\n");

      console.log("Sending request with:", {
        elementHtml: combinedHtml,
        prompt,
      });

      const response = await fetch(
        "https://jcbbqewbpkvyivldiiml.supabase.co/functions/v1/get-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYmJxZXdicGt2eWl2bGRpaW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNjQ0MjEsImV4cCI6MjA3Mjk0MDQyMX0.PeZN4bb8krYjW_1_dVel7LpRJxH_fGdeQ5_AV5jGMps",
          },
          body: JSON.stringify({
            elementHtml: combinedHtml,
            prompt: prompt,
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        // Get the error response body for more details
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Supabase function response:", result);

      // Execute the generated instructions automatically
      if (result.code) {
        executeCode(result.code);
      } else if (result.instructions) {
        executeCode(result.instructions);
      }

      // Clear the form after execution
      setPrompt("");
      setSelectedElements([]);
    } catch (error) {
      console.error("Error calling Supabase function:", error);
      // Log more details about the error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          "Network error - check if the Supabase function URL is correct and accessible"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating dot */}
      <Box
        onClick={() => setOpen(!open)}
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
        />
      </Box>

      {/* Panel */}
      {open && (
        <Card
          data-peek-ui="true"
          onMouseEnter={() => setIsHoveringPopup(true)}
          onMouseLeave={() => setIsHoveringPopup(false)}
          sx={{
            position: "fixed",
            bottom: "70px",
            right: "20px",
            width: "300px",
            padding: "10px",
            background: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            zIndex: 100001,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">DOM Modifier</Typography>

            {/* Show selection status */}
            <Typography variant="body2" color="text.secondary">
              {selectedElements.length === 0
                ? "Click elements to select them"
                : `Selected: ${selectedElements.length} element(s)`}
            </Typography>

            {/* Show chips for each selected element */}
            {selectedElements.length > 0 && (
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
                    onDelete={() => removeSelection(index)}
                    sx={{ marginBottom: 1 }}
                  />
                ))}
              </Stack>
            )}

            <TextField
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt text"
              style={{ width: "100%", marginTop: "5px" }}
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={sendToLLM}
                disabled={
                  selectedElements.length === 0 || !prompt.trim() || isLoading
                }
                sx={{ mt: 1 }}
              >
                {isLoading ? "Sending..." : "Send to LLM"}
              </Button>

              <Button
                variant="outlined"
                onClick={clearSelections}
                sx={{ borderRadius: 12 }}
                size="small"
                disabled={selectedElements.length === 0}
              >
                Clear All
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}
    </>
  );
}

import { useState } from "react";
import { type SelectedElement } from "./useElementSelection";
import { saveHistoryToSupabase } from "../utils/supabaseClient";

export interface Instruction {
  selector: string;
  style?: Record<string, string>;
  text?: string;
}

export const useLLMCommunication = () => {
  const [isLoading, setIsLoading] = useState(false);

  const executeCode = (instructions: Instruction[] | string) => {
    if (
      !instructions ||
      (Array.isArray(instructions) && instructions.length === 0)
    ) {
      console.log("No instructions to execute");
      return;
    }

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

                  if (ins.style && el instanceof HTMLElement) {
                    Object.assign(el.style, ins.style);
                  }

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
        parsedInstructions.forEach((ins) => {
          const el = document.querySelector(ins.selector);
          if (!el) return;

          if (ins.style && el instanceof HTMLElement) {
            Object.assign(el.style, ins.style);
          }

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

  const sendToLLM = async (
    selectedElements: SelectedElement[],
    prompt: string,
    onSuccess?: () => void,
    model: string = "gpt-4o-mini",
    onHistoryRefresh?: () => void
  ) => {
    if (selectedElements.length === 0 || !prompt.trim()) {
      console.log("No elements selected or prompt is empty");
      return;
    }

    setIsLoading(true);
    try {
      const combinedHtml = selectedElements
        .map((item) => item.html)
        .join("\n\n");

      console.log("Sending request with:", {
        elementHtml: combinedHtml,
        prompt,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            elementHtml: combinedHtml,
            prompt: prompt,
            model: model,
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Supabase function response:", result);

      if (result.code) {
        executeCode(result.code);
        // Save to history
        await saveHistoryToSupabase(prompt, `Executed code: ${JSON.stringify(result.code)}`);
        console.log("History saved successfully:", [{ prompt, action: `Executed code: ${JSON.stringify(result.code)}` }]);
      } else if (result.instructions) {
        executeCode(result.instructions);
        // Save to history
        await saveHistoryToSupabase(prompt, `Executed instructions: ${JSON.stringify(result.instructions)}`);
        console.log("History saved successfully:", [{ prompt, action: `Executed instructions: ${JSON.stringify(result.instructions)}` }]);
      }

      // Refresh history after saving
      setTimeout(() => {
        onHistoryRefresh?.();
      }, 500);

      onSuccess?.();
    } catch (error) {
      console.error("Error calling Supabase function:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          "Network error - check if the Supabase function URL is correct and accessible"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendToLLM,
    executeCode,
  };
};

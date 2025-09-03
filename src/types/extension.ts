// Extension-specific type definitions

export interface ExtensionState {
  isActive: boolean;
  selectedElement: ElementContext | null;
  modifications: ModificationState[];
  chatHistory: ChatMessage[];
}

export interface ElementContext {
  selector: string;
  tagName: string;
  className: string;
  computedStyles: CSSStyleDeclaration;
  dimensions: DOMRect;
  textContent: string;
  parentContext?: ElementContext;
}

export interface ModificationState {
  elementSelector: string;
  originalStyles: Record<string, string>;
  appliedStyles: Record<string, string>;
  command: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
}

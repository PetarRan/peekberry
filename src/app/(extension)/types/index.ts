/**
 * Chrome Extension Type Definitions
 */

// Extension message types
export interface ExtensionMessage {
  type: string;
  payload?: any;
  tabId?: number;
}

// Authentication types
export interface AuthToken {
  token: string;
  expiresAt: number;
  userId: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
}

// DOM interaction types
export interface ElementContext {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  computedStyles: Partial<CSSStyleDeclaration>;
  boundingRect: DOMRect;
}

export interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

export interface EditAction {
  id: string;
  type: 'style' | 'attribute' | 'content';
  element: ElementContext;
  mutation: DOMMutation;
  timestamp: Date;
  undoable: boolean;
}

// Screenshot types
export interface ScreenshotMetadata {
  pageUrl: string;
  pageTitle: string;
  editCount: number;
  dimensions: {
    width: number;
    height: number;
  };
}

// API request types
export interface APIRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Content script interface
export interface ContentScriptAPI {
  // DOM Interaction
  initializeElementSelection(): void;
  highlightElement(element: HTMLElement): void;
  selectElement(element: HTMLElement): ElementContext;
  applyMutation(mutation: DOMMutation): void;

  // UI Management
  createPeekberryBubble(): void;
  showChatPanel(): void;
  hideChatPanel(): void;

  // Screenshot
  captureScreenshot(): Promise<Blob | null>;

  // Session Management
  getEditHistory(): EditAction[];
  undoLastEdit(): void;
  redoEdit(): void;
}

// Background script interface
export interface BackgroundScriptAPI {
  // API Communication
  processEditCommand(
    command: string,
    context: ElementContext
  ): Promise<DOMMutation>;
  syncAuthToken(token: string): Promise<void>;
  uploadScreenshot(imageBlob: Blob, metadata: ScreenshotMetadata): Promise<any>;

  // Storage Management
  getAuthToken(): Promise<string | null>;
  storeAuthToken(token: string): Promise<void>;
  clearAuthToken(): Promise<void>;
}

// Chrome extension globals
declare global {
  interface Window {
    peekberryContentScript?: ContentScriptAPI;
  }
}

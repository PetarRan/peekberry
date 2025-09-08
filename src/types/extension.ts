/**
 * TypeScript interfaces for Chrome Extension components
 * These interfaces define the contracts for extension components
 */

import type {
  ElementContext,
  DOMMutation,
  EditAction,
  ScreenshotMetadata,
  Screenshot,
  ExtensionMessage,
  ExtensionResponse,
  ExtensionStorage,
  ChatPanelState,
} from '../schema';

// Content Script Interface
export interface ContentScript {
  // DOM Interaction Methods
  initializeElementSelection(): void;
  highlightElement(element: HTMLElement): void;
  selectElement(element: HTMLElement): ElementContext;
  applyMutation(mutation: DOMMutation): void;
  clearHighlights(): void;

  // UI Management Methods
  createPeekberryBubble(): void;
  showChatPanel(): void;
  hideChatPanel(): void;
  toggleChatPanel(): void;
  updateChatPanelState(state: Partial<ChatPanelState>): void;

  // Screenshot Methods
  captureScreenshot(): Promise<Blob>;
  prepareScreenshotArea(): void;

  // Session Management Methods
  getEditHistory(): EditAction[];
  addEditToHistory(edit: EditAction): void;
  undoLastEdit(): void;
  redoEdit(): void;
  clearEditHistory(): void;

  // Event Handlers
  onElementHover(event: MouseEvent): void;
  onElementClick(event: MouseEvent): void;
  onKeyboardShortcut(event: KeyboardEvent): void;

  // Cleanup Methods
  destroy(): void;
  removeEventListeners(): void;
}

// Background Script Interface
export interface BackgroundScript {
  // API Communication Methods
  processEditCommand(
    command: string,
    context: ElementContext
  ): Promise<DOMMutation>;
  uploadScreenshot(
    imageBlob: Blob,
    metadata: ScreenshotMetadata
  ): Promise<Screenshot>;
  syncUserStats(userId: string): Promise<void>;

  // Authentication Methods
  syncAuthToken(token: string): Promise<void>;
  getAuthToken(): Promise<string | null>;
  storeAuthToken(token: string): Promise<void>;
  clearAuthToken(): Promise<void>;
  validateAuthToken(token: string): Promise<boolean>;

  // Storage Management Methods
  getStorageData(): Promise<ExtensionStorage>;
  updateStorageData(data: Partial<ExtensionStorage>): Promise<void>;
  clearStorageData(): Promise<void>;

  // Message Handling Methods
  handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<ExtensionResponse>;
  sendMessageToContentScript(
    tabId: number,
    message: ExtensionMessage
  ): Promise<ExtensionResponse>;

  // Network Methods
  makeAPIRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ExtensionResponse<T>>;
  handleNetworkError(error: Error): void;

  // Lifecycle Methods
  initialize(): Promise<void>;
  cleanup(): void;
}

// Popup Interface (if needed for extension popup)
export interface PopupScript {
  // UI Methods
  render(): void;
  updateAuthStatus(isAuthenticated: boolean): void;
  showError(message: string): void;
  showSuccess(message: string): void;

  // Authentication Methods
  handleLogin(): void;
  handleLogout(): void;
  checkAuthStatus(): Promise<boolean>;

  // Communication Methods
  sendMessageToBackground(
    message: ExtensionMessage
  ): Promise<ExtensionResponse>;
  sendMessageToContentScript(
    message: ExtensionMessage
  ): Promise<ExtensionResponse>;

  // Event Handlers
  onLoginClick(): void;
  onLogoutClick(): void;
  onSettingsClick(): void;
}

// UI Component Interfaces for Content Script
export interface PeekberryBubble {
  element: HTMLElement;
  isVisible: boolean;
  position: { x: number; y: number };

  show(): void;
  hide(): void;
  toggle(): void;
  updatePosition(x: number, y: number): void;
  onClick(handler: () => void): void;
  destroy(): void;
}

export interface ChatPanel {
  element: HTMLElement;
  isOpen: boolean;
  state: ChatPanelState;

  open(): void;
  close(): void;
  toggle(): void;
  updateState(newState: Partial<ChatPanelState>): void;
  addMessage(message: string, type: 'user' | 'system' | 'error'): void;
  clearMessages(): void;
  showLoading(show: boolean): void;
  destroy(): void;
}

export interface ElementHighlighter {
  currentElement: HTMLElement | null;
  highlightElement: HTMLElement | null;

  highlight(element: HTMLElement): void;
  clearHighlight(): void;
  createHighlightOverlay(element: HTMLElement): HTMLElement;
  removeHighlightOverlay(): void;
  isElementHighlightable(element: HTMLElement): boolean;
}

export interface EditHistoryManager {
  history: EditAction[];
  currentIndex: number;
  maxHistorySize: number;

  addEdit(edit: EditAction): void;
  undo(): EditAction | null;
  redo(): EditAction | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  getHistory(): EditAction[];
}

export interface ScreenshotCapture {
  captureVisible(): Promise<Blob>;
  captureElement(element: HTMLElement): Promise<Blob>;
  captureFullPage(): Promise<Blob>;
  processImage(blob: Blob): Promise<Blob>;
  generateThumbnail(
    blob: Blob,
    maxWidth: number,
    maxHeight: number
  ): Promise<Blob>;
}

// Chrome Extension API Type Extensions
export interface ExtendedChrome {
  // Add any custom chrome API extensions here if needed
  // This interface can be used to extend the chrome global if needed
}

// Message Types for Extension Communication
export interface ContentScriptMessage extends ExtensionMessage {
  source: 'content-script';
  tabId?: number;
}

export interface BackgroundScriptMessage extends ExtensionMessage {
  source: 'background-script';
  tabId?: number;
}

export interface PopupScriptMessage extends ExtensionMessage {
  source: 'popup-script';
}

// Error Types for Extension
export interface ExtensionDOMError extends Error {
  name: 'ExtensionDOMError';
  element?: HTMLElement;
  selector?: string;
  operation?: string;
}

export interface ExtensionAPIError extends Error {
  name: 'ExtensionAPIError';
  status?: number;
  endpoint?: string;
  response?: unknown;
}

export interface ExtensionAuthError extends Error {
  name: 'ExtensionAuthError';
  code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'AUTH_REQUIRED';
}

// Configuration Interfaces
export interface ExtensionConfig {
  apiBaseUrl: string;
  maxHistorySize: number;
  screenshotQuality: number;
  highlightColor: string;
  bubblePosition: { x: number; y: number };
  chatPanelWidth: number;
  chatPanelHeight: number;
  enableKeyboardShortcuts: boolean;
  debugMode: boolean;
}

export interface ContentScriptConfig extends ExtensionConfig {
  selectors: {
    bubble: string;
    chatPanel: string;
    highlight: string;
  };
  zIndexes: {
    bubble: number;
    chatPanel: number;
    highlight: number;
  };
}

// Utility Types for Extension Development
export type ExtensionEventHandler<T = Event> = (
  event: T
) => void | Promise<void>;
export type ExtensionMessageHandler<
  T extends ExtensionMessage = ExtensionMessage,
> = (
  message: T,
  sender: chrome.runtime.MessageSender
) => Promise<ExtensionResponse> | ExtensionResponse;

// Export all interfaces for use in extension components
export type {
  ElementContext,
  DOMMutation,
  EditAction,
  ScreenshotMetadata,
  Screenshot,
  ExtensionMessage,
  ExtensionResponse,
  ExtensionStorage,
  ChatPanelState,
} from '../schema';

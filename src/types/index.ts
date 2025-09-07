export interface User {
  id: string; // Clerk user ID
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Screenshot {
  id: string;
  clerkUserId: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  metadata: ScreenshotMetadata;
  createdAt: Date;
  size: number;
}

export interface ScreenshotMetadata {
  pageUrl: string;
  pageTitle: string;
  editCount: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface UserStats {
  clerkUserId: string;
  editsThisMonth: number;
  screenshotsThisMonth: number;
  totalEdits: number;
  totalScreenshots: number;
  lastActivity: Date;
}

export interface EditAction {
  id: string;
  type: 'style' | 'attribute' | 'content';
  element: ElementContext;
  mutation: DOMMutation;
  timestamp: Date;
  undoable: boolean;
}

export interface ElementContext {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  computedStyles: CSSStyleDeclaration;
  boundingRect: DOMRect;
}

export interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

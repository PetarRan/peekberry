import { z } from 'zod';

export const ScreenshotMetadataSchema = z.object({
  pageUrl: z.string().url(),
  pageTitle: z.string(),
  editCount: z.number().int().min(0),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export const ScreenshotSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string(),
  filename: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  metadata: ScreenshotMetadataSchema,
  createdAt: z.date(),
  size: z.number().int().positive(),
});

export const UserStatsSchema = z.object({
  clerkUserId: z.string(),
  editsThisMonth: z.number().int().min(0),
  screenshotsThisMonth: z.number().int().min(0),
  totalEdits: z.number().int().min(0),
  totalScreenshots: z.number().int().min(0),
  lastActivity: z.date(),
});

export const DOMMutationSchema = z.object({
  type: z.enum(['style', 'attribute', 'content']),
  selector: z.string(),
  property: z.string(),
  value: z.string(),
  previousValue: z.string().optional(),
});

export const ElementContextSchema = z.object({
  selector: z.string(),
  tagName: z.string(),
  id: z.string().optional(),
  className: z.string().optional(),
  textContent: z.string().optional(),
  computedStyles: z.any(), // CSSStyleDeclaration is complex to validate
  boundingRect: z.any(), // DOMRect is complex to validate
});

export const EditActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['style', 'attribute', 'content']),
  element: ElementContextSchema,
  mutation: DOMMutationSchema,
  timestamp: z.date(),
  undoable: z.boolean(),
});

export type ScreenshotMetadata = z.infer<typeof ScreenshotMetadataSchema>;
export type Screenshot = z.infer<typeof ScreenshotSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type DOMMutation = z.infer<typeof DOMMutationSchema>;
export type ElementContext = z.infer<typeof ElementContextSchema>;
export type EditAction = z.infer<typeof EditActionSchema>;

import { z } from 'zod';

// Screenshot Metadata Schema
export const ScreenshotMetadataSchema = z.object({
  pageUrl: z.string().url(),
  pageTitle: z.string(),
  editCount: z.number().int().min(0),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

// Screenshot Schema
export const ScreenshotSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string(),
  filename: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  metadata: ScreenshotMetadataSchema,
  createdAt: z.date(),
  size: z.number().int().positive(),
});

// User Stats Schema
export const UserStatsSchema = z.object({
  clerkUserId: z.string(),
  editsThisMonth: z.number().int().min(0),
  screenshotsThisMonth: z.number().int().min(0),
  totalEdits: z.number().int().min(0),
  totalScreenshots: z.number().int().min(0),
  lastActivity: z.date(),
});

// DOM Mutation Schema
export const DOMMutationSchema = z.object({
  type: z.enum(['style', 'attribute', 'content']),
  selector: z.string(),
  property: z.string(),
  value: z.string(),
  previousValue: z.string().optional(),
});

// Element Context Schema
export const ElementContextSchema = z.object({
  selector: z.string(),
  tagName: z.string(),
  id: z.string().optional(),
  className: z.string().optional(),
  textContent: z.string().optional(),
  computedStyles: z.record(z.string()),
  boundingRect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }),
});

// Edit Action Schema
export const EditActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['style', 'attribute', 'content']),
  element: ElementContextSchema,
  mutation: DOMMutationSchema,
  timestamp: z.date(),
  undoable: z.boolean(),
});

// API Response Schemas
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  message: z.string().optional(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const ApiResponseSchema = z.union([
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
]);

// Upload Screenshot Request Schema
export const UploadScreenshotRequestSchema = z.object({
  filename: z.string(),
  metadata: ScreenshotMetadataSchema,
});

// Process Edit Command Request Schema
export const ProcessEditCommandRequestSchema = z.object({
  command: z.string().min(1),
  context: ElementContextSchema,
});

// Export type definitions
export type ScreenshotMetadata = z.infer<typeof ScreenshotMetadataSchema>;
export type Screenshot = z.infer<typeof ScreenshotSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type DOMMutation = z.infer<typeof DOMMutationSchema>;
export type ElementContext = z.infer<typeof ElementContextSchema>;
export type EditAction = z.infer<typeof EditActionSchema>;
export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
};
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
export type UploadScreenshotRequest = z.infer<
  typeof UploadScreenshotRequestSchema
>;
export type ProcessEditCommandRequest = z.infer<
  typeof ProcessEditCommandRequestSchema
>;

// Error Handling Schemas
export const ExtensionErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  code: z.string(),
  context: z.string().optional(),
  recoverable: z.boolean(),
  stack: z.string().optional(),
});

export const APIErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  status: z.number().int(),
  code: z.string(),
  details: z.unknown().optional(),
  stack: z.string().optional(),
});

// Specific API Response Schemas
export const ScreenshotListResponseSchema = ApiSuccessResponseSchema.extend({
  data: z.array(ScreenshotSchema),
});

export const UserStatsResponseSchema = ApiSuccessResponseSchema.extend({
  data: UserStatsSchema,
});

export const ProcessEditResponseSchema = ApiSuccessResponseSchema.extend({
  data: DOMMutationSchema,
});

export const UploadScreenshotResponseSchema = ApiSuccessResponseSchema.extend({
  data: ScreenshotSchema,
});

// Extension Message Schemas
export const ExtensionMessageSchema = z.object({
  type: z.enum([
    'AUTH_TOKEN_SYNC',
    'PROCESS_EDIT',
    'UPLOAD_SCREENSHOT',
    'GET_AUTH_STATUS',
  ]),
  payload: z.unknown().optional(),
});

export const AuthTokenSyncMessageSchema = ExtensionMessageSchema.extend({
  type: z.literal('AUTH_TOKEN_SYNC'),
  payload: z.object({
    token: z.string(),
    userId: z.string(),
  }),
});

export const ProcessEditMessageSchema = ExtensionMessageSchema.extend({
  type: z.literal('PROCESS_EDIT'),
  payload: z.object({
    command: z.string(),
    context: ElementContextSchema,
  }),
});

export const UploadScreenshotMessageSchema = ExtensionMessageSchema.extend({
  type: z.literal('UPLOAD_SCREENSHOT'),
  payload: z.object({
    imageBlob: z.instanceof(Blob),
    metadata: ScreenshotMetadataSchema,
  }),
});

export const GetAuthStatusMessageSchema = ExtensionMessageSchema.extend({
  type: z.literal('GET_AUTH_STATUS'),
});

// Extension Response Schema
export const ExtensionResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// Extension Storage Schema
export const ExtensionStorageSchema = z.object({
  authToken: z.string().optional(),
  userId: z.string().optional(),
  lastSync: z.number().optional(),
});

// Chat Panel State Schema
export const ChatPanelStateSchema = z.object({
  isOpen: z.boolean(),
  selectedElement: ElementContextSchema.nullable(),
  editHistory: z.array(EditActionSchema),
  currentCommand: z.string(),
});

// Additional API Response Schemas for specific endpoints
export const AuthStatusResponseSchema = ApiSuccessResponseSchema.extend({
  data: z.object({
    isAuthenticated: z.boolean(),
    userId: z.string().optional(),
    expiresAt: z.number().optional(),
  }),
});

export const DeleteScreenshotResponseSchema = ApiSuccessResponseSchema.extend({
  data: z.object({
    deletedId: z.string().uuid(),
    message: z.string(),
  }),
});

export const UpdateUserStatsResponseSchema = ApiSuccessResponseSchema.extend({
  data: UserStatsSchema,
});

// Validation Error Schema for form validation
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.unknown().optional(),
});

export const ValidationErrorResponseSchema = ApiErrorResponseSchema.extend({
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string(),
    details: z.array(ValidationErrorSchema),
  }),
});

// Rate Limiting Error Schema
export const RateLimitErrorResponseSchema = ApiErrorResponseSchema.extend({
  error: z.object({
    code: z.literal('RATE_LIMIT_EXCEEDED'),
    message: z.string(),
    details: z.object({
      retryAfter: z.number(),
      limit: z.number(),
      remaining: z.number(),
    }),
  }),
});

// Authentication Error Schema
export const AuthErrorResponseSchema = ApiErrorResponseSchema.extend({
  error: z.object({
    code: z.enum([
      'AUTH_REQUIRED',
      'TOKEN_EXPIRED',
      'TOKEN_INVALID',
      'INSUFFICIENT_PERMISSIONS',
    ]),
    message: z.string(),
    details: z
      .object({
        redirectUrl: z.string().url().optional(),
      })
      .optional(),
  }),
});

// Network Error Schema for client-side errors
export const NetworkErrorSchema = z.object({
  name: z.literal('NetworkError'),
  message: z.string(),
  code: z.enum(['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED', 'DNS_ERROR']),
  status: z.number().optional(),
  timeout: z.boolean().default(false),
  retryable: z.boolean().default(true),
});

// File Upload Error Schema
export const FileUploadErrorSchema = z.object({
  name: z.literal('FileUploadError'),
  message: z.string(),
  code: z.enum([
    'FILE_TOO_LARGE',
    'INVALID_FILE_TYPE',
    'UPLOAD_FAILED',
    'STORAGE_FULL',
  ]),
  fileSize: z.number().optional(),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
});

// AI Processing Error Schema
export const AIProcessingErrorSchema = z.object({
  name: z.literal('AIProcessingError'),
  message: z.string(),
  code: z.enum([
    'COMMAND_UNCLEAR',
    'ELEMENT_NOT_EDITABLE',
    'PROCESSING_FAILED',
    'SERVICE_UNAVAILABLE',
  ]),
  command: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});

// Database Error Schema
export const DatabaseErrorSchema = z.object({
  name: z.literal('DatabaseError'),
  message: z.string(),
  code: z.enum([
    'CONNECTION_ERROR',
    'QUERY_FAILED',
    'CONSTRAINT_VIOLATION',
    'TRANSACTION_FAILED',
  ]),
  table: z.string().optional(),
  operation: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']).optional(),
});

// Comprehensive Error Union Schema
export const AppErrorSchema = z.union([
  ExtensionErrorSchema,
  APIErrorSchema,
  NetworkErrorSchema,
  FileUploadErrorSchema,
  AIProcessingErrorSchema,
  DatabaseErrorSchema,
]);

// Pagination Schema for list endpoints
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  ApiSuccessResponseSchema.extend({
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationSchema,
    }),
  });

// Screenshot List with Pagination
export const PaginatedScreenshotListResponseSchema =
  PaginatedResponseSchema(ScreenshotSchema);

// Search and Filter Schemas
export const ScreenshotFilterSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minEditCount: z.number().int().min(0).optional(),
  maxEditCount: z.number().int().min(0).optional(),
  pageUrlContains: z.string().optional(),
  pageTitleContains: z.string().optional(),
});

export const ScreenshotSearchRequestSchema = z.object({
  query: z.string().optional(),
  filters: ScreenshotFilterSchema.optional(),
  pagination: PaginationSchema.omit({
    total: true,
    totalPages: true,
    hasNext: true,
    hasPrev: true,
  }).optional(),
  sortBy: z.enum(['createdAt', 'editCount', 'fileSize']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export additional type definitions
export type ExtensionError = z.infer<typeof ExtensionErrorSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type NetworkError = z.infer<typeof NetworkErrorSchema>;
export type FileUploadError = z.infer<typeof FileUploadErrorSchema>;
export type AIProcessingError = z.infer<typeof AIProcessingErrorSchema>;
export type DatabaseError = z.infer<typeof DatabaseErrorSchema>;
export type AppError = z.infer<typeof AppErrorSchema>;

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationErrorResponse = z.infer<
  typeof ValidationErrorResponseSchema
>;
export type RateLimitErrorResponse = z.infer<
  typeof RateLimitErrorResponseSchema
>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;

export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
export type DeleteScreenshotResponse = z.infer<
  typeof DeleteScreenshotResponseSchema
>;
export type UpdateUserStatsResponse = z.infer<
  typeof UpdateUserStatsResponseSchema
>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedScreenshotListResponse = z.infer<
  typeof PaginatedScreenshotListResponseSchema
>;
export type ScreenshotFilter = z.infer<typeof ScreenshotFilterSchema>;
export type ScreenshotSearchRequest = z.infer<
  typeof ScreenshotSearchRequestSchema
>;

export type ScreenshotListResponse = z.infer<
  typeof ScreenshotListResponseSchema
>;
export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;
export type ProcessEditResponse = z.infer<typeof ProcessEditResponseSchema>;
export type UploadScreenshotResponse = z.infer<
  typeof UploadScreenshotResponseSchema
>;
export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>;
export type AuthTokenSyncMessage = z.infer<typeof AuthTokenSyncMessageSchema>;
export type ProcessEditMessage = z.infer<typeof ProcessEditMessageSchema>;
export type UploadScreenshotMessage = z.infer<
  typeof UploadScreenshotMessageSchema
>;
export type GetAuthStatusMessage = z.infer<typeof GetAuthStatusMessageSchema>;
export type ExtensionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
export type ExtensionStorage = z.infer<typeof ExtensionStorageSchema>;
export type ChatPanelState = z.infer<typeof ChatPanelStateSchema>;

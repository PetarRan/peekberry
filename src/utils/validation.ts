import { z } from 'zod';
import {
  ScreenshotSchema,
  ScreenshotMetadataSchema,
  UserStatsSchema,
  EditActionSchema,
  DOMMutationSchema,
  ElementContextSchema,
  ProcessEditCommandRequestSchema,
  UploadScreenshotRequestSchema,
  ApiResponseSchema,
  ExtensionMessageSchema,
  ExtensionResponseSchema,
} from '../schema';

// Validation helper functions
export const validateScreenshot = (data: unknown) => {
  return ScreenshotSchema.safeParse(data);
};

export const validateScreenshotMetadata = (data: unknown) => {
  return ScreenshotMetadataSchema.safeParse(data);
};

export const validateUserStats = (data: unknown) => {
  return UserStatsSchema.safeParse(data);
};

export const validateEditAction = (data: unknown) => {
  return EditActionSchema.safeParse(data);
};

export const validateDOMMutation = (data: unknown) => {
  return DOMMutationSchema.safeParse(data);
};

export const validateElementContext = (data: unknown) => {
  return ElementContextSchema.safeParse(data);
};

export const validateProcessEditCommandRequest = (data: unknown) => {
  return ProcessEditCommandRequestSchema.safeParse(data);
};

export const validateUploadScreenshotRequest = (data: unknown) => {
  return UploadScreenshotRequestSchema.safeParse(data);
};

export const validateApiResponse = (data: unknown) => {
  return ApiResponseSchema.safeParse(data);
};

export const validateExtensionMessage = (data: unknown) => {
  return ExtensionMessageSchema.safeParse(data);
};

export const validateExtensionResponse = (data: unknown) => {
  return ExtensionResponseSchema.safeParse(data);
};

// Generic validation function
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
};

// Validation error handler
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Safe validation that throws ValidationError
export const validateSafe = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Validation failed: ${result.error.message}`,
      result.error.errors
    );
  }
  return result.data;
};

// Partial validation for updates (only works with ZodObject)
export const validatePartial = <T extends Record<string, any>>(
  schema: z.ZodObject<any>,
  data: unknown
) => {
  return schema.partial().safeParse(data);
};

// Array validation
export const validateArray = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return z.array(schema).safeParse(data);
};

// Optional validation
export const validateOptional = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.optional().safeParse(data);
};

// Type guards using Zod schemas
export const isScreenshot = (
  data: unknown
): data is z.infer<typeof ScreenshotSchema> => {
  return ScreenshotSchema.safeParse(data).success;
};

export const isScreenshotMetadata = (
  data: unknown
): data is z.infer<typeof ScreenshotMetadataSchema> => {
  return ScreenshotMetadataSchema.safeParse(data).success;
};

export const isUserStats = (
  data: unknown
): data is z.infer<typeof UserStatsSchema> => {
  return UserStatsSchema.safeParse(data).success;
};

export const isEditAction = (
  data: unknown
): data is z.infer<typeof EditActionSchema> => {
  return EditActionSchema.safeParse(data).success;
};

export const isDOMMutation = (
  data: unknown
): data is z.infer<typeof DOMMutationSchema> => {
  return DOMMutationSchema.safeParse(data).success;
};

export const isElementContext = (
  data: unknown
): data is z.infer<typeof ElementContextSchema> => {
  return ElementContextSchema.safeParse(data).success;
};

export const isExtensionMessage = (
  data: unknown
): data is z.infer<typeof ExtensionMessageSchema> => {
  return ExtensionMessageSchema.safeParse(data).success;
};

export const isApiResponse = (
  data: unknown
): data is z.infer<typeof ApiResponseSchema> => {
  return ApiResponseSchema.safeParse(data).success;
};

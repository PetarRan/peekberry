'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { screenshotsAPI } from '@/api/screenshots';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from '@/components/shared/ToastProvider';
import type { Screenshot, ScreenshotMetadata } from '@/schema';

export function useScreenshots(page: number = 1, limit: number = 20) {
  const { user } = useUser();
  const { handleApiError, createErrorContext } = useErrorHandler();

  return useQuery({
    queryKey: ['screenshots', user?.id, page, limit],
    queryFn: async () => {
      try {
        return await screenshotsAPI.getScreenshots(user!.id, page, limit);
      } catch (error) {
        const errorMessage = handleApiError(error as Error, 'getScreenshots');
        throw new Error(errorMessage);
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useScreenshot(id: string) {
  const { user } = useUser();
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['screenshot', id, user?.id],
    queryFn: async () => {
      try {
        return await screenshotsAPI.getScreenshot(id, user!.id);
      } catch (error) {
        const errorMessage = handleApiError(error as Error, 'getScreenshot');
        throw new Error(errorMessage);
      }
    },
    enabled: !!id && !!user?.id,
  });
}

export function useUploadScreenshot() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { handleUploadError } = useErrorHandler();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      metadata,
    }: {
      file: File;
      metadata: ScreenshotMetadata;
    }) => {
      try {
        return await screenshotsAPI.uploadScreenshot(file, metadata, user!.id);
      } catch (error) {
        const errorMessage = handleUploadError(error as Error);
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch screenshots list and user stats
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });

      showSuccess('Screenshot uploaded successfully!');
    },
    onError: (error) => {
      showError(error.message || 'Failed to upload screenshot');
    },
  });
}

export function useDeleteScreenshot() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { handleApiError } = useErrorHandler();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await screenshotsAPI.deleteScreenshot(id, user!.id);
      } catch (error) {
        const errorMessage = handleApiError(error as Error, 'deleteScreenshot');
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch screenshots list
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });

      showSuccess('Screenshot deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete screenshot');
    },
  });
}

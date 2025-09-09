'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { screenshotsAPI } from '@/api/screenshots';
import type { Screenshot, ScreenshotMetadata } from '@/schema';

export function useScreenshots(page: number = 1, limit: number = 20) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['screenshots', user?.id, page, limit],
    queryFn: () => screenshotsAPI.getScreenshots(user!.id, page, limit),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useScreenshot(id: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['screenshot', id, user?.id],
    queryFn: () => screenshotsAPI.getScreenshot(id, user!.id),
    enabled: !!id && !!user?.id,
  });
}

export function useUploadScreenshot() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: File;
      metadata: ScreenshotMetadata;
    }) => screenshotsAPI.uploadScreenshot(file, metadata, user!.id),
    onSuccess: () => {
      // Invalidate and refetch screenshots list and user stats
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
    onError: (error) => {
      console.error('Failed to upload screenshot:', error);
    },
  });
}

export function useDeleteScreenshot() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: (id: string) => screenshotsAPI.deleteScreenshot(id, user!.id),
    onSuccess: () => {
      // Invalidate and refetch screenshots list
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
    onError: (error) => {
      console.error('Failed to delete screenshot:', error);
    },
  });
}

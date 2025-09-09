'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  screenshotsAPI,
  Screenshot,
  ScreenshotCreateData,
} from '@/api/screenshots';

export function useScreenshots(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['screenshots', page, limit],
    queryFn: () => screenshotsAPI.getScreenshots(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useScreenshot(id: string) {
  return useQuery({
    queryKey: ['screenshot', id],
    queryFn: () => screenshotsAPI.getScreenshot(id),
    enabled: !!id,
  });
}

export function useCreateScreenshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScreenshotCreateData) =>
      screenshotsAPI.createScreenshot(data),
    onSuccess: () => {
      // Invalidate and refetch screenshots list
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
    onError: (error) => {
      console.error('Failed to create screenshot:', error);
    },
  });
}

export function useDeleteScreenshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => screenshotsAPI.deleteScreenshot(id),
    onSuccess: () => {
      // Invalidate and refetch screenshots list
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
    onError: (error) => {
      console.error('Failed to delete screenshot:', error);
    },
  });
}

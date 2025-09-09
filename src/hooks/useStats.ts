'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statsAPI, UserStats } from '@/api/stats';

export function useStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => statsAPI.getUserStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIncrementEditCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => statsAPI.incrementEditCount(),
    onSuccess: (data: UserStats) => {
      // Update the cache with new stats
      queryClient.setQueryData(['userStats'], data);
    },
    onError: (error) => {
      console.error('Failed to increment edit count:', error);
    },
  });
}

export function useIncrementScreenshotCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => statsAPI.incrementScreenshotCount(),
    onSuccess: (data: UserStats) => {
      // Update the cache with new stats
      queryClient.setQueryData(['userStats'], data);
    },
    onError: (error) => {
      console.error('Failed to increment screenshot count:', error);
    },
  });
}

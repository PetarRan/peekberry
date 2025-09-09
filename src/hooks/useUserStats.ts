'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { statsAPI } from '@/api/stats';
import type { UserStats } from '@/schema';

export function useUserStats() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: () => statsAPI.getUserStats(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useIncrementEditCount() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: () => statsAPI.incrementEditCount(user!.id),
    onSuccess: () => {
      // Invalidate and refetch user stats
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
    onError: (error) => {
      console.error('Failed to increment edit count:', error);
    },
  });
}

export function useIncrementScreenshotCount() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: () => statsAPI.incrementScreenshotCount(user!.id),
    onSuccess: () => {
      // Invalidate and refetch user stats
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
    onError: (error) => {
      console.error('Failed to increment screenshot count:', error);
    },
  });
}

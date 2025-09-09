'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { statsAPI, UserStats } from '@/api/stats';

export function useStats() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: () => statsAPI.getUserStats(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIncrementEditCount() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: () => statsAPI.incrementEditCount(user!.id),
    onSuccess: (data: UserStats) => {
      // Update the cache with new stats
      queryClient.setQueryData(['userStats', user?.id], data);
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
    onSuccess: (data: UserStats) => {
      // Update the cache with new stats
      queryClient.setQueryData(['userStats', user?.id], data);
    },
    onError: (error) => {
      console.error('Failed to increment screenshot count:', error);
    },
  });
}

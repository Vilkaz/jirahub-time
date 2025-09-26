import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiService } from '../services/api';
import { useTimeStore } from '../stores/timeStore';
import { config } from '../config/env';
import { toast } from '../hooks/use-toast';

export const useTimeTracking = () => {
  const queryClient = useQueryClient();
  const { setStatus, setLoading, updateElapsedTime } = useTimeStore();

  // Polling query for current status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['tracking-status'],
    queryFn: () => apiService.getStatus(),
    refetchInterval: config.STATUS_POLL_INTERVAL,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update store when status changes
  useEffect(() => {
    if (status) {
      setStatus(status);
    }
    setLoading(isLoading);
  }, [status, isLoading, setStatus, setLoading]);

  // Live timer updates
  useEffect(() => {
    if (status?.isTracking) {
      const interval = setInterval(() => {
        updateElapsedTime();
      }, config.TIMER_UPDATE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [status?.isTracking, updateElapsedTime]);

  // Start tracking mutation
  const startMutation = useMutation({
    mutationFn: (taskId: string) => apiService.startTracking(taskId),
    onSuccess: (data) => {
      setStatus(data.status);
      queryClient.invalidateQueries({ queryKey: ['tracking-status'] });
      toast({
        title: "Time tracking started",
        description: `Started tracking on ${data.status.activeTask?.key}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start tracking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop tracking mutation
  const stopMutation = useMutation({
    mutationFn: () => apiService.stopTracking(),
    onSuccess: (data) => {
      setStatus(data.status);
      queryClient.invalidateQueries({ queryKey: ['tracking-status'] });
      toast({
        title: "Time tracking stopped",
        description: "Your time has been logged successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to stop tracking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    status,
    isLoading,
    error,
    startTracking: startMutation.mutate,
    stopTracking: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiService.getTasks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
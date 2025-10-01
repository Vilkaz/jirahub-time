import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiService } from '../services/api';
import { useTimeStore } from '../stores/timeStore';
import { config } from '../config/env';
import { toast } from '../hooks/use-toast';
import { calculateDailySeconds } from '../utils/timeCalculations';

export const useTimeTracking = () => {
  const queryClient = useQueryClient();
  const { setStatus, setLoading, updateElapsedTime } = useTimeStore();

  // Initial status query - ONLY on page load, no polling
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['tracking-status'],
    queryFn: async () => {
      const data = await apiService.getStatus();
      console.log('📊 STATUS LOADED:', {
        isTracking: data.isTracking,
        activeTask: data.activeTask?.taskId,
        todayTotal: data.todayTotal?.seconds
      });
      return data;
    },
    staleTime: Infinity, // Never auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount
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

  // No live timer updates - the timer components handle their own display updates

  // Start tracking mutation
  const startMutation = useMutation({
    mutationFn: async ({ taskId, jiraUrl, jiraTitle }: { taskId: string; jiraUrl?: string; jiraTitle?: string }) => {
      // Check if currently tracking a different task
      const state = useTimeStore.getState();
      const isCurrentlyTracking = state.isTracking;
      const currentTaskId = state.activeTask?.taskId;

      console.log('🚀 START TRACKING:', { taskId, isCurrentlyTracking, currentTaskId });

      // If tracking a different task, stop it first
      if (isCurrentlyTracking && currentTaskId && currentTaskId !== taskId) {
        console.log('🛑 Stopping previous task before starting new one:', currentTaskId);

        const activeSince = state.activeSince;
        if (activeSince) {
          // Calculate dailySeconds for the task we're stopping
          const startTime = activeSince;
          const endTime = new Date();
          const dailySeconds = calculateDailySeconds(startTime, endTime);

          console.log('🛑 Stopping with dailySeconds:', dailySeconds);

          // Stop the previous task (await to ensure it completes)
          try {
            await apiService.stopTracking(dailySeconds);
            console.log('✅ Successfully stopped previous task');
          } catch (error) {
            console.error('❌ Failed to stop previous task:', error);
            // Continue anyway to start the new task
          }
        }
      }

      // Now start the new task
      return apiService.startTracking(taskId, jiraUrl, jiraTitle);
    },
    onSuccess: (data) => {
      console.log('📍 Start tracking response:', data);

      // Force refetch tasks to show updated times (previous task's time needs updating)
      queryClient.refetchQueries({ queryKey: ['tasks'] });

      // Update store immediately with returned tracking state (event-driven)
      if (data.trackingState) {
        setStatus({
          userId: data.trackingState.activeTask?.taskId || '',
          isTracking: data.trackingState.isTracking,
          activeTask: data.trackingState.activeTask,
          activeSince: data.trackingState.activeSince,
          todayTotal: { seconds: 0, hours: 0 },
          weekTotal: { seconds: 0, hours: 0 },
          monthTotal: { seconds: 0, hours: 0 }
        });
      }

      toast({
        title: "Time tracking started",
        description: data.message || `Started tracking ${data.taskId}`,
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
    mutationFn: () => {
      // Get activeSince from store to calculate daily seconds
      const state = useTimeStore.getState();
      const activeSince = state.activeSince;

      console.log('🛑 PREPARING TO STOP:');
      console.log('   activeSince:', activeSince);

      if (!activeSince) {
        console.warn('⚠️ No activeSince found in store - will send empty dailySeconds');
        return apiService.stopTracking({});
      }

      // Calculate dailySeconds based on session time and midnight crossing
      const startTime = activeSince; // Already a Date object
      const endTime = new Date();
      const dailySeconds = calculateDailySeconds(startTime, endTime);

      console.log('🛑 Calculated dailySeconds:', dailySeconds);

      return apiService.stopTracking(dailySeconds);
    },
    onSuccess: (data) => {
      console.log('📍 Stop tracking response:', data);

      // Force refetch tasks to show updated times
      queryClient.refetchQueries({ queryKey: ['tasks'] });

      // Update store immediately with returned tracking state (event-driven)
      if (data.trackingState) {
        setStatus({
          userId: '',
          isTracking: data.trackingState.isTracking,
          activeTask: data.trackingState.activeTask,
          activeSince: data.trackingState.activeSince,
          todayTotal: { seconds: 0, hours: 0 },
          weekTotal: { seconds: 0, hours: 0 },
          monthTotal: { seconds: 0, hours: 0 }
        });
      }

      toast({
        title: "Time tracking stopped",
        description: data.message || "Your time has been logged successfully",
      });
    },
    onError: (error) => {
      console.log('📍 Stop tracking error:', error);

      // If "no active session", just clear the frontend state anyway
      if (error.message?.includes('No active tracking session')) {
        setStatus({
          userId: '',
          isTracking: false,
          activeTask: null,
          activeSince: null,
          todayTotal: { seconds: 0, hours: 0 },
          weekTotal: { seconds: 0, hours: 0 },
          monthTotal: { seconds: 0, hours: 0 }
        });

        toast({
          title: "Time tracking stopped",
          description: "Tracking was already stopped",
        });
      } else {
        toast({
          title: "Failed to stop tracking",
          description: error.message,
          variant: "destructive",
        });
      }
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
    queryFn: async () => {
      const data = await apiService.getTasks();
      const taskTimes = data.tasks?.map(t => `${t.key}: ${t.totalSeconds}s`).join(', ');
      console.log('📋 TASKS LOADED WITH TIMES:', taskTimes);
      return data;
    },
    staleTime: Infinity, // Never auto-refetch - only fetch on user action
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount
    retry: 2,
  });
};
import { create } from 'zustand';
import { TrackingStatus, Task, ActiveTask } from '../types/api';

interface TimeState {
  status: TrackingStatus | null;
  isTracking: boolean;
  activeTask: ActiveTask | null;
  activeSince: Date | null;
  todayTotal: number; // seconds
  weekTotal: number; // seconds

  // UI State
  isLoading: boolean;
  lastUpdate: Date | null;

  // Actions
  setStatus: (status: TrackingStatus) => void;
  startTracking: (task: Task) => void;
  stopTracking: () => void;
  updateElapsedTime: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  status: null,
  isTracking: false,
  activeTask: null,
  activeSince: null,
  todayTotal: 0,
  weekTotal: 0,
  
  isLoading: true,
  lastUpdate: null,

  setStatus: (status) => {
    // Only log significant changes
    const currentState = get();
    const taskChanged = currentState.activeTask?.taskId !== status.activeTask?.taskId;
    const trackingChanged = currentState.isTracking !== status.isTracking;

    if (taskChanged || trackingChanged) {
      console.log('🏪 STATUS CHANGED:', {
        isTracking: status.isTracking,
        activeTask: status.activeTask?.taskId,
        activeSince: status.activeSince
      });
    }

    return set({
      status,
      isTracking: status.isTracking || false,
      activeTask: status.activeTask || null,
      activeSince: status.activeSince ? new Date(status.activeSince * 1000) : null,
      todayTotal: status.todayTotal?.seconds || 0,
      weekTotal: status.weekTotal?.seconds || 0,
      lastUpdate: new Date(),
    });
  },

  startTracking: (task) => {
    // This is called from UI actions, create a mock ActiveTask
    const activeTask: ActiveTask = {
      taskId: task.taskId,
      jiraTitle: task.title,
      jiraUrl: task.url,
      currentSessionDuration: 0
    };
    set({
      isTracking: true,
      activeTask,
      activeSince: new Date(),
    });
  },

  stopTracking: () => set({ 
    isTracking: false,
    activeTask: null,
    activeSince: null,
  }),

  updateElapsedTime: () => {
    const state = get();
    if (state.isTracking && state.activeSince) {
      // This will trigger UI updates for the live timer
      set({ lastUpdate: new Date() });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({
    status: null,
    isTracking: false,
    activeTask: null,
    activeSince: null,
    todayTotal: 0,
    weekTotal: 0,
    isLoading: false,
    lastUpdate: null,
  }),
}));

// Helper function to calculate elapsed time
export const getElapsedTime = (startTime: Date): number => {
  return Math.floor((Date.now() - startTime.getTime()) / 1000);
};

// Helper function to format time display
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
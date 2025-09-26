import { create } from 'zustand';
import { TrackingStatus, Task } from '../types/api';

interface TimeState {
  status: TrackingStatus | null;
  isTracking: boolean;
  activeTask: Task | null;
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

  setStatus: (status) => set({ 
    status,
    isTracking: status.isTracking,
    activeTask: status.activeTask || null,
    activeSince: status.activeSince ? new Date(status.activeSince) : null,
    todayTotal: status.todayTotal.seconds,
    weekTotal: status.weekTotal.seconds,
    lastUpdate: new Date(),
  }),

  startTracking: (task) => set({ 
    isTracking: true,
    activeTask: task,
    activeSince: new Date(),
  }),

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
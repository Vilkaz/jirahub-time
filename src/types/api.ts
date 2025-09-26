// API Types for Time Tracking System

export interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Task {
  taskId: string;
  key: string;
  title: string;
  status: string;
  project: string;
  assignee?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  url: string;
  description?: string;
  estimatedHours?: number;
}

export interface TimeTotal {
  seconds: number;
  hours: number;
}

export interface TrackingStatus {
  userId: string;
  isTracking: boolean;
  activeTask?: Task;
  activeSince?: string;
  todayTotal: TimeTotal;
  weekTotal: TimeTotal;
  monthTotal?: TimeTotal;
}

export interface TimeEntry {
  entryId: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
}

export interface TimeEvent {
  action: 'start' | 'stop';
  taskId?: string;
  timestamp?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total?: number;
  page?: number;
  hasMore?: boolean;
}

export interface TimesheetEntry {
  date: string;
  taskId: string;
  taskKey: string;
  taskTitle: string;
  project: string;
  duration: number;
  description?: string;
}

export interface TimesheetResponse {
  entries: TimesheetEntry[];
  totalHours: number;
  startDate: string;
  endDate: string;
}

export interface JiraConnection {
  isConnected: boolean;
  username?: string;
  instanceUrl?: string;
  lastSync?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Request/Response Types
export interface StatusResponse extends TrackingStatus {}

export interface EventRequest extends TimeEvent {}

export interface EventResponse {
  success: boolean;
  status: TrackingStatus;
  message?: string;
}

export interface TimesheetRequest {
  startDate: string;
  endDate: string;
  format?: 'json' | 'csv' | 'pdf';
}

export interface JiraAuthStartResponse {
  authUrl: string;
  state: string;
}

export interface JiraAuthInitiateRequest {
  returnUrl: string;
}

// Chart Data Types
export interface DailyTimeData {
  date: string;
  hours: number;
  day: string;
}

export interface TaskTimeData {
  taskKey: string;
  taskTitle: string;
  hours: number;
  percentage: number;
}

export interface ProjectTimeData {
  project: string;
  hours: number;
  taskCount: number;
}
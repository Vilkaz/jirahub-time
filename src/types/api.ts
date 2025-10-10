// API Types for Time Tracking System

export interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Session data for a single day
export interface SessionData {
  seconds: number;
  description: string;
}

export interface Task {
  taskId: string;
  key: string;
  title: string;
  status: string;
  project: string;
  sapTask?: string;  // SAP task identifier (e.g., "PS245-46 - Moro Hub")
  assignee?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  url: string;
  description?: string;
  estimatedHours?: number;
  totalSeconds?: number;
  tracked_time?: Record<string, SessionData | number>; // Map of DD.MM.YYYY -> {seconds, description} or legacy number
}

export interface TimeTotal {
  seconds: number;
  hours: number;
}

export interface ActiveTask {
  taskId: string;
  jiraTitle: string;
  jiraUrl?: string;
  currentSessionDuration: number;
}

export interface TrackingStatus {
  userId: string;
  isTracking: boolean;
  activeTask?: ActiveTask;
  activeSince?: number;
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
  dailySeconds?: Record<string, number>; // Map of date (DD.MM.YYYY) to seconds
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
  action: 'start' | 'stop';
  taskId?: string;
  startTime?: number;
  duration?: number;
  message?: string;
  trackingState?: {
    isTracking: boolean;
    activeTask?: ActiveTask;
    activeSince?: number;
    startTime?: number;
    stopTime?: number;
  };
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

// Report Types
export interface DailyReportEntry {
  taskKey: string;
  taskTitle: string;
  sapTask?: string;  // SAP task identifier
  date: string; // YYYY-MM-DD format
  hours: number;
  description?: string; // Session description
}

export interface ReportRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  format: 'json' | 'csv';
}

export interface ReportResponse {
  entries: DailyReportEntry[];
  startDate: string;
  endDate: string;
  totalHours: number;
  totalDays: number;
}
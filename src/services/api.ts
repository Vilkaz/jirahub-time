import { config } from '../config/env';
import { 
  TrackingStatus, 
  TasksResponse, 
  EventRequest, 
  EventResponse,
  TimesheetRequest,
  TimesheetResponse,
  JiraAuthStartResponse 
} from '../types/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private getAuthToken(): string | null {
    // In production, this would come from your auth store/context
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.accessToken || null;
      }
    } catch (e) {
      console.warn('Failed to get auth token:', e);
    }
    return null;
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Status API
  async getStatus(): Promise<TrackingStatus> {
    return this.request<TrackingStatus>('/v1/status');
  }

  // Tasks API
  async getTasks(): Promise<TasksResponse> {
    return this.request<TasksResponse>('/v1/tasks');
  }

  // Time Tracking Events
  async startTracking(taskId: string): Promise<EventResponse> {
    const eventData: EventRequest = {
      action: 'start',
      taskId,
      timestamp: new Date().toISOString(),
    };

    return this.request<EventResponse>('/v1/events', {
      method: 'POST',
      headers: {
        'Idempotency-Key': this.generateIdempotencyKey(),
      },
      body: JSON.stringify(eventData),
    });
  }

  async stopTracking(): Promise<EventResponse> {
    const eventData: EventRequest = {
      action: 'stop',
      timestamp: new Date().toISOString(),
    };

    return this.request<EventResponse>('/v1/events', {
      method: 'POST',
      headers: {
        'Idempotency-Key': this.generateIdempotencyKey(),
      },
      body: JSON.stringify(eventData),
    });
  }

  // Timesheet API
  async getTimesheet(params: TimesheetRequest): Promise<TimesheetResponse> {
    const queryParams = new URLSearchParams(params as any);
    return this.request<TimesheetResponse>(`/v1/timesheet?${queryParams}`);
  }

  // Jira Integration
  async startJiraAuth(): Promise<JiraAuthStartResponse> {
    return this.request<JiraAuthStartResponse>('/v1/jira/auth/start');
  }

  async initiateJiraAuth(returnUrl: string): Promise<{ authUrl?: string; authorization_url?: string }> {
    return this.request('/v1/jira/auth/initiate', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
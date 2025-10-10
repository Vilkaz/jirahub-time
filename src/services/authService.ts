/**
 * Authentication Service
 * Handles login status checks, session management, and user profile
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  jira_connected: boolean;
}

export interface AuthResponse {
  loggedIn: boolean;
  userInfo?: UserProfile;
  error?: string;
}

class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  constructor() {
    // Get API base URL from window.CONFIG - MUST be set, no fallback
    const configUrl = (window as any).CONFIG?.API_BASE_URL;
    if (!configUrl) {
      throw new Error('API_BASE_URL not found in window.CONFIG - config.js must be loaded before app initialization');
    }
    this.baseUrl = configUrl;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }


  /**
   * Check if user is currently logged in (server-driven session via HttpOnly cookie)
   */
  private getSessionTokenFromCookie(): string | null {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1] || null;
  }

  async checkLoginStatus(): Promise<AuthResponse> {
    try {
      console.log('🔍 [AUTH] Starting login status check...');
      console.log('🌐 [AUTH] API Base URL:', this.baseUrl);
      console.log('🍪 [AUTH] All cookies:', document.cookie);

      // Get session token from cookie
      const sessionToken = this.getSessionTokenFromCookie();
      if (!sessionToken) {
        console.log('❌ [AUTH] No session token found in cookies');
        console.log('🍪 [AUTH] Available cookies:', document.cookie.split('; '));
        return { loggedIn: false, error: 'No session token' };
      }

      console.log('🍪 [AUTH] Found session token in cookie:', sessionToken.substring(0, 8) + '...');
      console.log('📤 [AUTH] Preparing POST request to:', `${this.baseUrl}/v1/session/me`);

      const requestBody = { session_token: sessionToken };
      console.log('📋 [AUTH] Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/v1/session/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📨 [AUTH] Response status:', response.status);
      console.log('📨 [AUTH] Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📦 [AUTH] Response data:', data);

      if (data.loggedIn) {
        console.log('✅ [AUTH] User is logged in:', data.user);
        return {
          loggedIn: true,
          userInfo: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            jira_connected: data.user.jira_connected
          }
        };
      } else {
        console.log('❌ [AUTH] User is not logged in');
        console.log('📄 [AUTH] Server response indicates not logged in:', data);
        return {
          loggedIn: false,
          error: 'Not authenticated'
        };
      }
    } catch (error) {
      console.error('❌ [AUTH] Login status check failed:', error);
      console.log('🚨 [AUTH] Full error details:', {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      return {
        loggedIn: false,
        error: 'Authentication check failed'
      };
    }
  }

  /**
   * Initiate login flow (redirect to Jira OAuth - no popup, clean redirect)
   */
  async initiateLogin(): Promise<void> {
    console.log('🚀 Starting clean redirect login flow...');

    // Direct redirect to OAuth initiate endpoint
    // The backend will handle user ID creation from Jira accountId
    window.location.href = `${this.baseUrl}/v1/jira/auth/initiate`;
  }

  /**
   * Logout user (clear server session)
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out...');

      const response = await fetch(`${this.baseUrl}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('✅ Logout completed:', data.message);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if API call fails, we consider it logged out
    }
  }

  /**
   * Get user profile information (from session/me endpoint)
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const authResponse = await this.checkLoginStatus();
      return authResponse.loggedIn ? authResponse.userInfo || null : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

export default AuthService.getInstance();
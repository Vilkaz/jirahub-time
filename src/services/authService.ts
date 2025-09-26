/**
 * Authentication Service
 * Handles login status checks, session management, and user profile
 */

export interface UserProfile {
  user_id: string;
  jira_connected: boolean;
  jira_instance_url?: string;
  session_expires: number;
  login_time: number;
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
    // Get API base URL from window.CONFIG or fallback
    this.baseUrl = (window as any).CONFIG?.API_BASE_URL ||
                   'https://8woyezkzac.execute-api.eu-central-1.amazonaws.com';
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Get session token from localStorage or cookie
   */
  private getSessionToken(): string | null {
    // Try localStorage first (for cross-domain support)
    const localToken = localStorage.getItem('session_token');
    if (localToken) {
      console.log('📱 Found session token in localStorage');
      return localToken;
    }

    // Fallback to cookie (for same-domain production)
    const cookieMatch = document.cookie.match(/session_token=([^;]+)/);
    if (cookieMatch) {
      console.log('🍪 Found session token in cookie');
      return cookieMatch[1];
    }

    return null;
  }

  /**
   * Store session token in localStorage
   */
  private storeSessionToken(token: string): void {
    localStorage.setItem('session_token', token);
    console.log('💾 Stored session token in localStorage');
  }

  /**
   * Clear session token from storage
   */
  private clearSessionToken(): void {
    localStorage.removeItem('session_token');
    console.log('🗑️ Cleared session token from localStorage');
  }

  /**
   * Check if user is currently logged in (has valid session + Jira tokens)
   */
  async checkLoginStatus(): Promise<AuthResponse> {
    try {
      console.log('🔍 Checking login status...');

      const sessionToken = this.getSessionToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Send session token as Authorization header if available
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`${this.baseUrl}/v1/auth/check`, {
        method: 'GET',
        credentials: 'include', // Still include cookies for fallback
        headers,
      });

      const data = await response.json();

      if (data.loggedIn) {
        console.log('✅ User is logged in:', data.userInfo);
        return {
          loggedIn: true,
          userInfo: data.userInfo
        };
      } else {
        console.log('❌ User is not logged in:', data.error);
        // Clear invalid token
        this.clearSessionToken();
        return {
          loggedIn: false,
          error: data.error || 'Not authenticated'
        };
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Clear token on error
      this.clearSessionToken();
      return {
        loggedIn: false,
        error: 'Authentication check failed'
      };
    }
  }

  /**
   * Initiate login flow (redirect to Jira OAuth)
   */
  async initiateLogin(): Promise<void> {
    try {
      console.log('🚀 Starting login flow...');

      // Call the OAuth initiation endpoint (existing flow)
      const response = await fetch(`${this.baseUrl}/v1/jira/auth/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'web-user-' + Date.now() // Generate a unique user ID
        }),
      });

      const data = await response.json();

      if (data.success && data.authorization_url) {
        console.log('🔄 Redirecting to Jira OAuth...');

        // Open OAuth in popup window
        const popup = window.open(
          data.authorization_url,
          'jira-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion with session token
        return new Promise((resolve, reject) => {
          const messageHandler = (event: MessageEvent) => {
            console.log('📨 Received message from OAuth popup:', event.data);

            // Handle new format with session token
            if (event.data?.type === 'jira_auth_success' && event.data?.sessionToken) {
              console.log('✅ Login successful with session token!');

              // Store the session token
              this.storeSessionToken(event.data.sessionToken);

              popup?.close();
              window.removeEventListener('message', messageHandler);
              resolve();
            }
            // Handle legacy format (fallback)
            else if (event.data === 'jira_auth_success') {
              console.log('✅ Login successful (legacy format)!');
              popup?.close();
              window.removeEventListener('message', messageHandler);
              resolve();
            }
          };

          window.addEventListener('message', messageHandler);

          // Handle popup being closed manually
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageHandler);
              reject(new Error('Login popup was closed'));
            }
          }, 1000);
        });
      } else {
        throw new Error('Failed to initiate login');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (clear session)
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out...');

      const sessionToken = this.getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`${this.baseUrl}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      const data = await response.json();
      console.log('✅ Logout completed:', data.message);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if API call fails, we consider it logged out
    } finally {
      // Always clear local session token
      this.clearSessionToken();
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.profile;
      } else {
        console.error('Failed to get user profile:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

export default AuthService.getInstance();
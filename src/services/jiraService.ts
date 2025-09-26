import { apiService } from './api';
import { config } from '../config/env';

export interface JiraOAuthState {
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

export class JiraService {
  private static readonly OAUTH_STATE_KEY = 'jira_oauth_state';

  /**
   * Generate PKCE code verifier and challenge for OAuth
   */
  private async generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const codeVerifier = this.generateRandomString(128);

    // Create code challenge using SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    // Base64 URL encode
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate a random string for OAuth state and code verifier
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Start the Jira OAuth flow
   */
  async startOAuthFlow(): Promise<void> {
    try {
      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = await this.generatePKCE();
      const state = this.generateRandomString(32);

      // Store OAuth state for validation
      const oauthState: JiraOAuthState = {
        state,
        codeVerifier,
        redirectUri: `${window.location.origin}/jira/callback`
      };

      sessionStorage.setItem(JiraService.OAUTH_STATE_KEY, JSON.stringify(oauthState));

      // Call our backend to initiate OAuth
      const response = await apiService.initiateJiraAuth(oauthState.redirectUri);

      // Redirect to Jira OAuth - API returns 'authorization_url', not 'authUrl'
      window.location.href = response.authorization_url || response.authUrl;

    } catch (error) {
      console.error('Failed to start Jira OAuth:', error);
      throw new Error('Failed to start Jira connection. Please try again.');
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(urlParams: URLSearchParams): Promise<{
    username: string;
    instanceUrl: string;
  }> {
    try {
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code || !state) {
        throw new Error('Missing OAuth parameters in callback');
      }

      // Validate state parameter
      const storedStateData = sessionStorage.getItem(JiraService.OAUTH_STATE_KEY);
      if (!storedStateData) {
        throw new Error('Invalid OAuth state - no stored state found');
      }

      const storedState: JiraOAuthState = JSON.parse(storedStateData);
      if (storedState.state !== state) {
        throw new Error('Invalid OAuth state - state mismatch');
      }

      // Exchange code for tokens via our backend
      const response = await fetch(`${config.API_BASE_URL}/v1/jira/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          code,
          state,
          codeVerifier: storedState.codeVerifier,
          redirectUri: storedState.redirectUri
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to exchange OAuth code');
      }

      const result = await response.json();

      // Clean up stored state
      sessionStorage.removeItem(JiraService.OAUTH_STATE_KEY);

      return {
        username: result.username || 'Unknown User',
        instanceUrl: config.JIRA_INSTANCE_URL
      };

    } catch (error) {
      // Clean up on error
      sessionStorage.removeItem(JiraService.OAUTH_STATE_KEY);
      console.error('OAuth callback failed:', error);
      throw error;
    }
  }

  /**
   * Test the Jira connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch tasks to test connection
      await apiService.getTasks();
      return true;
    } catch (error) {
      console.error('Jira connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current auth token
   */
  private getAuthToken(): string | null {
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

  /**
   * Check if we're currently handling an OAuth callback
   */
  isOAuthCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  }
}

export const jiraService = new JiraService();
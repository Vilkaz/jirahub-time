/**
 * Authentication Hook
 * Provides authentication state and methods throughout the app
 */

import { useState, useEffect } from 'react';
import authService, { UserProfile, AuthResponse } from '../services/authService';
import { useJiraStore } from '../stores/jiraStore';

export type AuthStatus = 'checking' | 'logged_out' | 'logged_in';

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  error: string | null;
}

interface AuthHook extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(): AuthHook {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'checking',
    user: null,
    error: null,
  });

  const { setConnection, disconnect } = useJiraStore();

  const checkAuth = async () => {
    console.log('🔍 useAuth: Checking authentication status...');

    setAuthState(prev => ({ ...prev, status: 'checking', error: null }));

    try {
      const response: AuthResponse = await authService.checkLoginStatus();

      if (response.loggedIn && response.userInfo) {
        console.log('✅ useAuth: User is authenticated');
        setAuthState({
          status: 'logged_in',
          user: response.userInfo,
          error: null,
        });

        // Sync Jira connection status with auth data
        if (response.userInfo.jira_connected) {
          setConnection({
            isConnected: true,
            instanceUrl: 'https://kukanauskas.atlassian.net', // You may want to get this from backend
            username: response.userInfo.name || response.userInfo.email,
            lastSync: new Date().toISOString()
          });
        } else {
          disconnect();
        }
      } else {
        console.log('❌ useAuth: User is not authenticated');
        setAuthState({
          status: 'logged_out',
          user: null,
          error: response.error || 'Not logged in',
        });

        // Clear Jira connection when not authenticated
        disconnect();
      }
    } catch (error) {
      console.error('❌ useAuth: Auth check failed:', error);
      setAuthState({
        status: 'logged_out',
        user: null,
        error: 'Authentication check failed',
      });

      // Clear Jira connection on error
      disconnect();
    }
  };

  const login = async () => {
    console.log('🚀 useAuth: Starting login...');

    try {
      await authService.initiateLogin();

      // After successful OAuth, recheck auth status
      console.log('✅ useAuth: Login flow completed, checking auth status...');
      await checkAuth();
    } catch (error) {
      console.error('❌ useAuth: Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        status: 'logged_out',
        error: 'Login failed',
      }));
    }
  };

  const logout = async () => {
    console.log('🚪 useAuth: Starting logout...');

    try {
      await authService.logout();

      setAuthState({
        status: 'logged_out',
        user: null,
        error: null,
      });

      // Clear Jira connection on logout
      disconnect();
    } catch (error) {
      console.error('❌ useAuth: Logout failed:', error);
      // Still set as logged out even if API call failed
      setAuthState({
        status: 'logged_out',
        user: null,
        error: null,
      });

      // Clear Jira connection even on logout error
      disconnect();
    }
  };

  // Check auth status on hook initialization
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
}
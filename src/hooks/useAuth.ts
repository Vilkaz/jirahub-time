/**
 * Authentication Hook
 * Provides authentication state and methods throughout the app
 */

import { useState, useEffect } from 'react';
import authService, { UserProfile, AuthResponse } from '../services/authService';

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
      } else {
        console.log('❌ useAuth: User is not authenticated');
        setAuthState({
          status: 'logged_out',
          user: null,
          error: response.error || 'Not logged in',
        });
      }
    } catch (error) {
      console.error('❌ useAuth: Auth check failed:', error);
      setAuthState({
        status: 'logged_out',
        user: null,
        error: 'Authentication check failed',
      });
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
    } catch (error) {
      console.error('❌ useAuth: Logout failed:', error);
      // Still set as logged out even if API call failed
      setAuthState({
        status: 'logged_out',
        user: null,
        error: null,
      });
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
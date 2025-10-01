/**
 * Main Index Page
 * Handles authentication state and shows appropriate UI
 */

import React, { useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { UserProfile } from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { status, user, login, logout, checkAuth } = useAuth();

  // Handle session token from OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session_token');

    if (sessionToken) {
      console.log('🍪 Setting session token from OAuth redirect:', sessionToken);

      // Set session token as HttpOnly-like cookie (using secure approach)
      // Since we can't set HttpOnly from JS, we'll store it securely and send it with requests
      document.cookie = `session_token=${sessionToken}; Path=/; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;

      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Force auth check with new cookie
      setTimeout(() => {
        checkAuth();
      }, 100);
    }
  }, [checkAuth]);

  console.log('📍 Index: Auth status =', status, 'User =', user?.user_id);

  // Show loading screen while checking authentication
  if (status === 'checking') {
    return <LoadingScreen />;
  }

  // Show login screen if not authenticated
  if (status === 'logged_out') {
    return <LoginScreen onLogin={login} />;
  }

  // Show main app with user profile in header if authenticated
  if (status === 'logged_in' && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with user profile */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Work Assistant</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Compact user profile */}
              <UserProfile user={user} onLogout={logout} />
            </div>
          </div>
        </header>

        {/* Main dashboard content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Dashboard />
        </main>
      </div>
    );
  }

  // Fallback (should not reach here)
  return <LoadingScreen />;
};

export default Index;

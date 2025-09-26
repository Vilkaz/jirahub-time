/**
 * Login Screen Component
 * Shown when user is not authenticated
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  isLoading?: boolean;
}

export function LoginScreen({ onLogin, isLoading = false }: LoginScreenProps) {
  const handleLogin = async () => {
    try {
      await onLogin();
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by the useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <CardTitle className="text-2xl">Work Assistant</CardTitle>
          </div>
          <CardDescription>
            Professional time tracking and task management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Welcome Back
            </h3>
            <p className="text-sm text-gray-600">
              Sign in with your Jira account to access your workspace and track your time efficiently.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.017 1.5c5.799 0 10.5 4.701 10.5 10.5s-4.701 10.5-10.5 10.5S1.517 17.799 1.517 12S6.218 1.5 12.017 1.5zm0 1.5c-4.971 0-9 4.029-9 9s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"/>
                    <path d="M9.017 8.5l-2.5 2.5 2.5 2.5v-1.5h7v-2h-7z"/>
                  </svg>
                  Sign in with Jira
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              By signing in, you agree to connect your Jira workspace for time tracking and task management.
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>🔒 Secure OAuth 2.0</span>
                <span>📊 Time Tracking</span>
              </div>
              <div className="flex justify-between">
                <span>📈 Analytics</span>
                <span>📋 Task Management</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
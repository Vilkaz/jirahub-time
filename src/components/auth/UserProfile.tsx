/**
 * User Profile Component
 * Shown when user is authenticated - displays user info and logout option
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Clock, ExternalLink } from 'lucide-react';
import { UserProfile as UserProfileType } from '@/services/authService';

interface UserProfileProps {
  user: UserProfileType;
  onLogout: () => Promise<void>;
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getSessionTimeLeft = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = user.session_expires - now;

    if (timeLeft <= 0) return 'Expired';

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getJiraInstanceName = () => {
    if (!user.jira_instance_url) return 'Unknown';
    try {
      const url = new URL(user.jira_instance_url);
      return url.hostname.split('.')[0]; // Extract subdomain from kukanauskas.atlassian.net
    } catch {
      return 'Jira';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Welcome back!</CardTitle>
              <p className="text-sm text-gray-600 truncate max-w-[200px]">
                {user.user_id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              Connected to {getJiraInstanceName()}
            </span>
          </div>
          {user.jira_instance_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(user.jira_instance_url, '_blank')}
              className="text-green-600 hover:text-green-700"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Session Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Session expires:</span>
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {getSessionTimeLeft()}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Logged in:</span>
            <span className="text-gray-900 text-xs">
              {formatDate(user.login_time)}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 text-center">
            <div className="grid grid-cols-2 gap-2">
              <span>✅ Time Tracking Active</span>
              <span>📊 Analytics Available</span>
              <span>📋 Task Sync Enabled</span>
              <span>🔒 Secure Session</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * Loading Screen Component
 * Shown while checking authentication status
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Work Assistant</span>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <div className="text-center">
              <p className="text-sm text-gray-600">Checking login status...</p>
              <p className="text-xs text-gray-500 mt-1">Please wait a moment</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
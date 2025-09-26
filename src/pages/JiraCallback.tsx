import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useJiraStore } from '../stores/jiraStore';
import { jiraService } from '../services/jiraService';
import { config } from '../config/env';

export const JiraCallback = () => {
  const navigate = useNavigate();
  const { setConnection, setConnectionError } = useJiraStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Jira connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for error from Jira
        const error = urlParams.get('error');
        if (error) {
          throw new Error(`Jira OAuth error: ${error}`);
        }

        // Handle successful callback
        const result = await jiraService.handleOAuthCallback(urlParams);

        // Update connection state
        setConnection({
          isConnected: true,
          username: result.username,
          instanceUrl: result.instanceUrl,
          lastSync: new Date().toISOString()
        });

        setStatus('success');
        setMessage('Successfully connected to Jira!');

        // Redirect after a brief success message
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect to Jira');
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    handleCallback();
  }, [navigate, setConnection, setConnectionError]);

  const handleRetry = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'processing' && 'Connecting to Jira'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && `Connecting to ${config.JIRA_INSTANCE_URL?.replace('https://', '')}`}
            {status === 'success' && 'You will be redirected shortly...'}
            {status === 'error' && 'Please try connecting again'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'processing' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please wait while we establish your connection...
              </p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <Button
                onClick={handleRetry}
                className="w-full"
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useState } from 'react';
import { Zap, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingButton } from '../ui/loading-button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useJiraStore } from '../../stores/jiraStore';
import { jiraService } from '../../services/jiraService';
import { config } from '../../config/env';
import { cn } from '../../lib/utils';

interface JiraConnectionButtonProps {
  className?: string;
  variant?: 'button' | 'card';
  showStatus?: boolean;
}

export const JiraConnectionButton = ({
  className,
  variant = 'button',
  showStatus = true
}: JiraConnectionButtonProps) => {
  const {
    connection,
    isConnecting,
    connectionError,
    setConnecting,
    setConnectionError,
    setConnection,
    disconnect
  } = useJiraStore();

  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setConnectionError(null);

      // Add small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));

      await jiraService.startOAuthFlow();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setConnecting(false); // Reset on error
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectionError(null);
  };

  const handleTestConnection = async () => {
    if (!connection) return;

    setIsTestingConnection(true);
    try {
      const isWorking = await jiraService.testConnection();
      if (isWorking) {
        setConnection({
          ...connection,
          lastSync: new Date().toISOString()
        });
        setConnectionError(null);
      } else {
        setConnectionError('Connection test failed. Please reconnect.');
      }
    } catch (error) {
      setConnectionError('Failed to test connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Button variant
  if (variant === 'button') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {connection?.isConnected ? (
          <>
            {showStatus && (
              <Badge
                variant="outline"
                className="text-xs flex items-center space-x-1 bg-green-50 border-green-200 text-green-700"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Jira Connected</span>
              </Badge>
            )}
            <LoadingButton
              variant="ghost"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isTestingConnection}
              loadingText="Testing..."
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Test
            </LoadingButton>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <LoadingButton
            variant="outline"
            size="sm"
            onClick={handleConnect}
            isLoading={isConnecting}
            loadingText="Connecting..."
            className="flex items-center space-x-1"
          >
            <Zap className="h-3 w-3" />
            <span>Connect Jira</span>
          </LoadingButton>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Jira Integration</CardTitle>
            <CardDescription>
              Connect to {config.JIRA_INSTANCE_URL?.replace('https://', '')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        {connection?.isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  <p className="text-xs text-green-600">
                    {connection.username} • {config.JIRA_INSTANCE_URL?.replace('https://', '')}
                  </p>
                </div>
              </div>
            </div>

            {connection.lastSync && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(connection.lastSync).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Connect your Jira account to start tracking time on your issues
            </p>
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <span>{config.JIRA_INSTANCE_URL?.replace('https://', '')}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        {connection?.isConnected ? (
          <div className="flex w-full space-x-2">
            <LoadingButton
              variant="outline"
              onClick={handleTestConnection}
              isLoading={isTestingConnection}
              loadingText="Testing..."
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Connection
            </LoadingButton>
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="text-muted-foreground hover:text-destructive"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <LoadingButton
            onClick={handleConnect}
            isLoading={isConnecting}
            loadingText="Connecting to Jira..."
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            Connect to Jira
          </LoadingButton>
        )}
      </CardFooter>
    </Card>
  );
};
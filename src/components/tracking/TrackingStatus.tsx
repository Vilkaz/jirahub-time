import { Play, Square, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LiveTimer } from '../ui/live-timer';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { cn } from '../../lib/utils';

interface TrackingStatusProps {
  className?: string;
}

export const TrackingStatus = ({ className }: TrackingStatusProps) => {
  const { 
    status, 
    isLoading, 
    startTracking, 
    stopTracking, 
    isStarting, 
    isStopping 
  } = useTimeTracking();
  
  const { isTracking, activeTask } = useTimeStore();

  const isActionLoading = isStarting || isStopping;

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      // For demo purposes, we'll use the last active task if available
      // In production, this would open a task selector
      if (activeTask) {
        startTracking({
          taskId: activeTask.taskId,
          jiraUrl: activeTask.jiraUrl,
          jiraTitle: activeTask.jiraTitle
        });
      }
    }
  };

  const getStatusBadgeVariant = () => {
    if (isTracking) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (isLoading) return 'Loading...';
    if (isTracking && activeTask) return 'Active';
    return 'Idle';
  };

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Current Session</span>
          </CardTitle>
          <Badge variant={getStatusBadgeVariant()} className="text-xs">
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Session Timer */}
        {isTracking && (
          <div className="text-center space-y-2">
            <LiveTimer size="xl" className="justify-center" />
          </div>
        )}

        {/* Active Task Info */}
        {activeTask && (
          <div className="space-y-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1 min-w-0">
                {activeTask.jiraUrl ? (
                  <a
                    href={activeTask.jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground truncate hover:text-primary hover:underline cursor-pointer block"
                    title={`Open ${activeTask.taskId} in Jira`}
                  >
                    {activeTask.jiraTitle}
                  </a>
                ) : (
                  <h3 className="font-semibold text-foreground truncate">
                    {activeTask.jiraTitle}
                  </h3>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {activeTask.taskId}
                  </Badge>
                </div>
              </div>
              {activeTask.jiraUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => window.open(activeTask.jiraUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleToggleTracking}
            disabled={isActionLoading || isLoading}
            size="lg"
            className={cn(
              'w-full max-w-xs h-12 font-semibold transition-all duration-300',
              isTracking 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg' 
                : 'btn-success shadow-lg hover:shadow-xl'
            )}
          >
            {isActionLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                <span>{isStarting ? 'Starting...' : 'Stopping...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isTracking ? (
                  <>
                    <Square className="h-5 w-5" />
                    <span>Stop Tracking</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>Start Tracking</span>
                  </>
                )}
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
import { useState, useEffect, useCallback } from 'react';
import { Play, Square, ExternalLink, Clock, Calendar, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingButton } from '../ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LiveTimer } from '../ui/live-timer';
import { useTimeTracking, useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { cn } from '../../lib/utils';
import { calculateTodayTotal, calculateWeekTotal, formatHours } from '../../utils/timeCalculations';
import { apiService } from '../../services/api';

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

  const { isTracking, activeTask, activeSince } = useTimeStore();
  const { data: tasksData, refetch } = useTasks();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [sessionDescription, setSessionDescription] = useState('');
  const [lastSavedDescription, setLastSavedDescription] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  const isActionLoading = isStarting || isStopping;

  // Get today's date in DD.MM.YYYY format
  const getTodayKey = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Update current time every second when tracking (for real-time stats)
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Load current description from task when active task changes
  useEffect(() => {
    if (activeTask && tasksData?.tasks) {
      const task = tasksData.tasks.find(t => t.taskId === activeTask.taskId);
      if (task && task.tracked_time) {
        const todayKey = getTodayKey();
        const todaySession = task.tracked_time[todayKey];

        if (todaySession && typeof todaySession === 'object') {
          const desc = todaySession.description || '';
          setSessionDescription(desc);
          setLastSavedDescription(desc);
        } else {
          setSessionDescription('');
          setLastSavedDescription('');
        }
      } else {
        setSessionDescription('');
        setLastSavedDescription('');
      }
    }
  }, [activeTask?.taskId, tasksData]);

  // Debounced save function
  const saveDescription = useCallback(async (description: string) => {
    if (!activeTask || !tasksData?.tasks) return;

    const task = tasksData.tasks.find(t => t.taskId === activeTask.taskId);
    if (!task) return;

    setIsSavingDescription(true);
    try {
      const todayKey = getTodayKey();
      const tracked_time = { ...task.tracked_time };

      // Get existing seconds for today or 0
      const todaySession = tracked_time[todayKey];
      let seconds = 0;

      if (typeof todaySession === 'object') {
        seconds = todaySession.seconds;
      } else if (typeof todaySession === 'number') {
        seconds = todaySession;
      }

      // Update with new description
      tracked_time[todayKey] = {
        seconds,
        description
      };

      await apiService.updateTask(activeTask.taskId, tracked_time, task.sapTask);

      // Update last saved description to prevent re-saving
      setLastSavedDescription(description);
    } catch (error) {
      console.error('Failed to save description:', error);
    } finally {
      setIsSavingDescription(false);
    }
  }, [activeTask, tasksData]);

  // Debounce the description save - only save if changed
  useEffect(() => {
    if (!isTracking) return;

    // Only save if description has actually changed from last saved
    if (sessionDescription === lastSavedDescription) return;

    const timeoutId = setTimeout(() => {
      saveDescription(sessionDescription);
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [sessionDescription, isTracking, lastSavedDescription, saveDescription]);

  // Calculate today and week totals for the active task
  const calculateActiveTaskTotals = () => {
    if (!activeTask || !tasksData?.tasks) {
      return { todayTotal: 0, weekTotal: 0 };
    }

    const task = tasksData.tasks.find(t => t.taskId === activeTask.taskId);
    if (!task || !task.tracked_time) {
      return { todayTotal: 0, weekTotal: 0 };
    }

    let todayTotal = calculateTodayTotal(task.tracked_time);
    let weekTotal = calculateWeekTotal(task.tracked_time);

    // Add current session time if tracking
    if (isTracking && activeSince) {
      const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
      const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
      todayTotal += currentSessionSeconds;
      weekTotal += currentSessionSeconds;
    }

    return { todayTotal, weekTotal };
  };

  const { todayTotal, weekTotal } = calculateActiveTaskTotals();

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
        {/* Session Timer - only show current session duration */}
        {isTracking && (
          <div className="text-center space-y-2">
            <LiveTimer size="xl" className="justify-center" sessionOnly={true} />
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

            {/* Today and Week stats for active task */}
            {isTracking && (todayTotal > 0 || weekTotal > 0) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Today:</span>
                  <span className="text-foreground font-semibold">{formatHours(todayTotal)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">This Week:</span>
                  <span className="text-foreground font-semibold">{formatHours(weekTotal)}</span>
                </div>
              </div>
            )}

            {/* Session Description */}
            {isTracking && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-description" className="text-sm font-medium">
                    Session Description
                  </Label>
                  {isSavingDescription && (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  )}
                </div>
                <Textarea
                  id="session-description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className="text-sm resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-saves as you type. This description will be included in your reports.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <LoadingButton
            onClick={handleToggleTracking}
            isLoading={isActionLoading || isLoading}
            loadingText={isStarting ? 'Starting...' : 'Stopping...'}
            size="lg"
            className={cn(
              'w-full max-w-xs h-12 font-semibold transition-all duration-300',
              isTracking
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg'
                : 'btn-success shadow-lg hover:shadow-xl'
            )}
          >
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
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
};
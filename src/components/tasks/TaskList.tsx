import { useState, useEffect } from 'react';
import { Play, ExternalLink, Search, Filter, Clock, Timer, Calendar, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { Task } from '../../types/api';
import { cn } from '../../lib/utils';
import { calculateTodayTotal, calculateWeekTotal, formatHours } from '../../utils/timeCalculations';

interface TaskListProps {
  className?: string;
  onTaskSelect?: (task: Task) => void;
}

export const TaskList = ({ className, onTaskSelect }: TaskListProps) => {
  const { data: tasksData, isLoading, error } = useTasks();
  const { activeTask, isTracking, activeSince } = useTimeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const tasks = tasksData?.tasks || [];

  // Log tasks data only on initial load
  useEffect(() => {
    if (tasksData?.tasks && !searchQuery && !selectedPriority) {
      console.log('📋 TASKS LOADED:', tasksData.tasks.map(t => ({
        taskId: t.taskId,
        key: t.key,
        totalSeconds: t.totalSeconds
      })));
    }
  }, []); // Empty dependency to log only once

  // Log active task info only when it changes
  useEffect(() => {
    if (activeTask) {
      console.log('🎯 ACTIVE TASK CHANGED:', {
        taskId: activeTask.taskId,
        jiraTitle: activeTask.jiraTitle,
        isTracking,
        activeSince
      });
    }
  }, [activeTask?.taskId]); // Only log when taskId changes

  // Update current time every second when tracking
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Filter tasks based on search and priority
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const isActiveTask = (task: Task) => {
    return activeTask?.taskId === task.taskId;
  };

  const handleStartTask = (task: Task) => {
    onTaskSelect?.(task);
  };

  const formatTrackedTime = (seconds?: number, isActive?: boolean) => {
    let totalSeconds = seconds || 0;

    // For active task, add current session time
    if (isActive && isTracking && activeSince) {
      // activeSince is a Date object from the store
      const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
      const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
      totalSeconds += currentSessionSeconds;
    }

    // Always show time, even if 0
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (error) {
    return (
      <Card className={cn('card-elevated', className)}>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Failed to load tasks
            </p>
            <p className="text-xs text-destructive">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Available Tasks</span>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs">
              {filteredTasks.length}
            </Badge>
          )}
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, projects, or keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex space-x-1">
              {['Critical', 'High', 'Medium', 'Low'].map(priority => (
                <Button
                  key={priority}
                  variant={selectedPriority === priority ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedPriority(
                    selectedPriority === priority ? '' : priority
                  )}
                >
                  {priority}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedPriority ? 'No tasks match your filters' : 'No tasks available'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.taskId}
              className={cn(
                'p-4 rounded-lg border border-card-border transition-all duration-200',
                'hover:border-primary/50 hover:shadow-md',
                isActiveTask(task) && 'border-primary bg-primary-light'
              )}
            >
              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="font-medium text-foreground truncate">
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline cursor-pointer"
                      title={`Open ${task.key} in Jira`}
                    >
                      {task.title}
                    </a>
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.key}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.project}
                    </Badge>
                    {task.priority && (
                      <Badge
                        variant={getPriorityColor(task.priority)}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                    <Badge
                      variant={isActiveTask(task) ? "default" : "secondary"}
                      className="text-xs flex items-center gap-1"
                    >
                      <Timer className="h-3 w-3" />
                      {formatTrackedTime(task.totalSeconds, isActiveTask(task))}
                    </Badge>
                  </div>

                  {/* Today and This Week stats - show if has tracked_time OR is actively tracking */}
                  {((task.tracked_time && Object.keys(task.tracked_time).length > 0) || isActiveTask(task)) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Today: {formatHours(
                          calculateTodayTotal(task.tracked_time || {}) +
                          (isActiveTask(task) && isTracking && activeSince
                            ? Math.floor((currentTime - (activeSince instanceof Date ? activeSince.getTime() : activeSince)) / 1000)
                            : 0)
                        )}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>This Week: {formatHours(
                          calculateWeekTotal(task.tracked_time || {}) +
                          (isActiveTask(task) && isTracking && activeSince
                            ? Math.floor((currentTime - (activeSince instanceof Date ? activeSince.getTime() : activeSince)) / 1000)
                            : 0)
                        )}</span>
                      </div>
                    </div>
                  )}

                  {task.assignee && (
                    <p className="text-xs text-muted-foreground">
                      Assigned to: {task.assignee}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(task.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  {!isActiveTask(task) && (
                    <Button
                      size="sm"
                      variant={isTracking ? "outline" : "default"}
                      className="text-xs"
                      onClick={() => handleStartTask(task)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  
                  {isActiveTask(task) && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
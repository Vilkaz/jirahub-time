import { useState, useEffect } from 'react';
import { Play, ExternalLink, Search, Filter, Clock, Timer, Calendar, CalendarDays, Edit, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingButton } from '../ui/loading-button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { Task } from '../../types/api';
import { cn } from '../../lib/utils';
import { calculateTodayTotal, calculateWeekTotal, formatHours } from '../../utils/timeCalculations';
import { EditTaskDialog } from './EditTaskDialog';
import { CreateManualTaskDialog } from './CreateManualTaskDialog';
import { apiService } from '../../services/api';

interface TaskListProps {
  className?: string;
  onTaskSelect?: (task: Task) => void;
}

export const TaskList = ({ className, onTaskSelect }: TaskListProps) => {
  const { data: tasksData, isLoading, error, refetch } = useTasks();
  const { activeTask, isTracking, activeSince } = useTimeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'jira' | 'manual'>('jira');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const tasks = tasksData?.tasks || [];

  // Separate tasks by type
  const jiraTasks = tasks.filter(t => !t.taskId.startsWith('manual:'));
  const manualTasks = tasks.filter(t => t.taskId.startsWith('manual:'));

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

  // Filter tasks based on search, priority, and tab
  const currentTasks = activeTab === 'jira' ? jiraTasks : manualTasks;

  const filteredTasks = currentTasks.filter(task => {
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

  const handleStartTask = async (task: Task) => {
    setStartingTaskId(task.taskId);
    try {
      onTaskSelect?.(task);
      // Wait a bit to let the API call complete before resetting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleSaveTask = async (
    taskId: string,
    sessions: Array<{ date: string; hours: number; minutes: number }>,
    sapTask?: string
  ) => {
    // Convert sessions back to tracked_time format
    const tracked_time: Record<string, number> = {};

    sessions.forEach(session => {
      // Convert ISO date (2025-10-01) to DD.MM.YYYY format
      const [year, month, day] = session.date.split('-');
      const dateKey = `${day}.${month}.${year}`;
      const totalSeconds = session.hours * 3600 + session.minutes * 60;

      if (totalSeconds > 0) {
        tracked_time[dateKey] = totalSeconds;
      }
    });

    // Call API to update task
    await apiService.updateTask(taskId, tracked_time, sapTask);

    // Refetch tasks to get updated data
    refetch();
  };

  const handleCreateManualTask = async (taskData: {
    taskId: string;
    title: string;
    url?: string;
    sapProjectId?: string;
    sapProjectName?: string;
  }) => {
    console.log('📝 Creating manual task:', taskData);

    try {
      // Call API to create manual task
      const result = await apiService.createManualTask(taskData);
      console.log('✅ Manual task created successfully:', result);

      // Refetch tasks to include the new manual task
      console.log('🔄 Refetching tasks...');
      await refetch();
      console.log('✅ Tasks refetched');

      // Switch to manual tab to see the new task
      console.log('📂 Switching to manual tab');
      setActiveTab('manual');
    } catch (err) {
      console.error('❌ Failed to create manual task:', err);
      throw err; // Re-throw to let dialog handle it
    }
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Available Tasks</span>
            {!isLoading && (
              <Badge variant="secondary" className="text-xs">
                {filteredTasks.length}
              </Badge>
            )}
          </div>
          {activeTab === 'manual' && (
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Manual Task
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'jira' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jira">
              Jira Tasks ({jiraTasks.length})
            </TabsTrigger>
            <TabsTrigger value="manual">
              Manual Tasks ({manualTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3 mt-4">
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

            {/* Tasks List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                    {task.sapProject && (
                      <a
                        href={task.sapProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                        title={`Open ${task.sapProject.name} in SAP`}
                      >
                        <Badge variant="outline" className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 cursor-pointer transition-colors">
                          SAP: {task.sapProject.name}
                        </Badge>
                      </a>
                    )}
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
                    onClick={() => setEditingTask(task)}
                    title="Edit time sessions"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(task.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  {!isActiveTask(task) && (
                    <LoadingButton
                      size="sm"
                      variant={isTracking ? "outline" : "default"}
                      className="text-xs"
                      onClick={() => handleStartTask(task)}
                      isLoading={startingTaskId === task.taskId}
                      loadingText="Starting..."
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </LoadingButton>
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}

      <CreateManualTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateManualTask}
      />
    </Card>
  );
};
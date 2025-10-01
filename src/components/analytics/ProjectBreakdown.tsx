import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ListChecks, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { calculateWeekTotal, formatDate } from '../../utils/timeCalculations';

interface ProjectBreakdownProps {
  className?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(355, 78%, 56%)',
];

export const ProjectBreakdown = ({ className }: ProjectBreakdownProps) => {
  const { data: tasksData, isLoading } = useTasks();
  const { isTracking, activeSince, activeTask } = useTimeStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second when tracking (for real-time updates)
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate task breakdown for current week
  const calculateTaskBreakdown = () => {
    const tasks = tasksData?.tasks || [];
    const taskData: Array<{
      taskKey: string;
      taskTitle: string;
      hours: number;
      color: string;
    }> = [];

    console.log('📊 === PROJECT BREAKDOWN CALCULATION ===');
    console.log('📊 Total tasks:', tasks.length);

    tasks.forEach((task, index) => {
      const trackedTime = task.tracked_time || {};
      const weekSeconds = calculateWeekTotal(trackedTime);
      let weekHours = weekSeconds / 3600; // Convert seconds to hours

      console.log(`📊 Task ${task.key}:`, {
        trackedTime,
        weekSeconds,
        weekHours: weekHours.toFixed(2),
        totalSeconds: task.totalSeconds || 0,
      });

      // Add current session time if this is the active task
      if (isTracking && activeTask?.taskId === task.taskId && activeSince) {
        const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
        const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
        weekHours += currentSessionSeconds / 3600;
        console.log(`📊   Active task - adding ${currentSessionSeconds}s from current session`);
      }

      // Only include tasks with time tracked this week
      if (weekHours > 0) {
        console.log(`📊   ✅ Including task (${weekHours.toFixed(2)}h)`);
        taskData.push({
          taskKey: task.key,
          taskTitle: task.title,
          hours: weekHours,
          color: COLORS[index % COLORS.length],
        });
      } else {
        console.log(`📊   ❌ Skipping task (0 hours this week)`);
      }
    });

    console.log('📊 Tasks with time this week:', taskData.length);
    console.log('📊 =====================================');

    // Sort by hours descending
    return taskData.sort((a, b) => b.hours - a.hours);
  };

  const data = calculateTaskBreakdown();
  const totalHours = data.reduce((sum, task) => sum + task.hours, 0);
  const totalTasks = data.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalHours > 0 ? ((data.value / totalHours) * 100).toFixed(1) : '0.0';
      return (
        <div className="rounded-lg border border-card-border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground text-xs">{data.payload.taskKey}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{data.payload.taskTitle}</p>
          <p className="text-sm text-primary mt-1">
            Hours: <span className="font-medium">{data.value.toFixed(1)}</span> ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={cn('card-elevated', className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ListChecks className="h-5 w-5" />
            <span>Task Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ListChecks className="h-5 w-5" />
            <span>Task Breakdown</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Current Week</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="hours"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks tracked this week
            </div>
          ) : (
            data.map((task, index) => {
              const percentage = totalHours > 0 ? ((task.hours / totalHours) * 100).toFixed(1) : '0.0';
              return (
                <div key={task.taskKey} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">
                        {task.taskKey}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.taskTitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-foreground">
                      {task.hours.toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentage}%
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-card-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-primary">
                {totalHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">
                {totalTasks}
              </p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ListChecks, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { calculateWeekTotal, formatDate } from '../../utils/timeCalculations';
import { DateRangePickerAdvanced, DateRangePreset } from '../ui/date-range-picker-advanced';
import { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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

  // Initialize with current week
  const initialRange: DateRange = {
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);

  const handleDateRangeChange = (range: DateRange | undefined, preset: DateRangePreset) => {
    setDateRange(range);
    console.log('Date range changed:', { range, preset });
  };

  // Update current time every second when tracking (for real-time updates)
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate task breakdown for selected date range
  const calculateTaskBreakdown = () => {
    const tasks = tasksData?.tasks || [];
    const taskData: Array<{
      taskKey: string;
      taskTitle: string;
      hours: number;
      color: string;
    }> = [];

    // If no date range selected, return empty data
    if (!dateRange?.from || !dateRange?.to) {
      return taskData;
    }

    // Get all dates in the selected range
    const rangeDates = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });
    const rangeDateStrs = new Set(rangeDates.map(d => formatDate(d)));

    console.log('📊 === PROJECT BREAKDOWN CALCULATION ===');
    console.log('📊 Total tasks:', tasks.length);
    console.log('📊 Date range:', dateRange.from, 'to', dateRange.to);
    console.log('📊 Range includes', rangeDateStrs.size, 'days');

    tasks.forEach((task, index) => {
      const trackedTime = task.tracked_time || {};

      // Sum seconds only for dates in the selected range
      let rangeSeconds = 0;
      Object.entries(trackedTime).forEach(([dateStr, seconds]) => {
        if (rangeDateStrs.has(dateStr)) {
          rangeSeconds += seconds;
        }
      });

      let rangeHours = rangeSeconds / 3600; // Convert seconds to hours

      console.log(`📊 Task ${task.key}:`, {
        rangeSeconds,
        rangeHours: rangeHours.toFixed(2),
      });

      // Add current session time if this is the active task and today is in range
      if (isTracking && activeTask?.taskId === task.taskId && activeSince) {
        const todayStr = formatDate(new Date());
        if (rangeDateStrs.has(todayStr)) {
          const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
          const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
          rangeHours += currentSessionSeconds / 3600;
          console.log(`📊   Active task - adding ${currentSessionSeconds}s from current session`);
        }
      }

      // Only include tasks with time tracked in selected range
      if (rangeHours > 0) {
        console.log(`📊   ✅ Including task (${rangeHours.toFixed(2)}h)`);
        taskData.push({
          taskKey: task.key,
          taskTitle: task.title,
          hours: rangeHours,
          color: COLORS[index % COLORS.length],
        });
      } else {
        console.log(`📊   ❌ Skipping task (0 hours in range)`);
      }
    });

    console.log('📊 Tasks with time in range:', taskData.length);
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
          <DateRangePickerAdvanced value={dateRange} onChange={handleDateRangeChange} />
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
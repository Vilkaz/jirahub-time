import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../hooks/useTimeTracking';
import { useTimeStore } from '../../stores/timeStore';
import { formatDate, getCurrentWeekDates } from '../../utils/timeCalculations';
import { DateRangePickerAdvanced, DateRangePreset } from '../ui/date-range-picker-advanced';
import { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format as formatDateFns } from 'date-fns';

interface TimeChartProps {
  className?: string;
}

export const TimeChart = ({ className }: TimeChartProps) => {
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

  // Update current time every second when tracking (for real-time chart updates)
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate data for selected date range from tracked_time
  const calculateWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: Array<{ day: string; hours: number; date: string }> = [];

    // If no date range selected, return empty data
    if (!dateRange?.from || !dateRange?.to) {
      return weekData;
    }

    // Get all dates in the selected range
    const rangeDates = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    rangeDates.forEach(date => {
      const dateStr = formatDate(date);
      const dayName = days[date.getDay()];

      // For short ranges (<=7 days), show day names, otherwise show date
      const displayLabel = rangeDates.length <= 7
        ? dayName
        : formatDateFns(date, 'MM/dd');

      weekData.push({
        day: displayLabel,
        hours: 0,
        date: dateStr,
      });
    });

    // Sum up seconds from all tasks for each day
    const tasks = tasksData?.tasks || [];
    tasks.forEach(task => {
      const trackedTime = task.tracked_time || {};

      Object.entries(trackedTime).forEach(([dateStr, entry]) => {
        const dayEntry = weekData.find(d => d.date === dateStr);
        if (dayEntry) {
          // Handle both old format (number) and new format (object with seconds)
          const seconds = typeof entry === 'number' ? entry : entry.seconds;
          dayEntry.hours += seconds / 3600; // Convert seconds to hours
        }
      });
    });

    // Add current active session time to today (if today is in selected range)
    if (isTracking && activeSince && activeTask) {
      const todayStr = formatDate(new Date());
      const todayEntry = weekData.find(d => d.date === todayStr);
      if (todayEntry) {
        const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
        const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
        todayEntry.hours += currentSessionSeconds / 3600;
      }
    }

    return weekData;
  };

  const data = calculateWeekData();
  const totalHours = data.reduce((sum, day) => sum + day.hours, 0);
  const averageHours = totalHours / data.filter(d => d.hours > 0).length || 0;
  const workDays = data.filter(d => d.hours > 0).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border border-card-border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-sm text-primary">
            Hours: <span className="font-medium">{data.value.toFixed(1)}</span>
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
            <TrendingUp className="h-5 w-5" />
            <span>Weekly Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted animate-pulse rounded-lg" />
              <div className="h-16 bg-muted animate-pulse rounded-lg" />
              <div className="h-16 bg-muted animate-pulse rounded-lg" />
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
            <TrendingUp className="h-5 w-5" />
            <span>Weekly Overview</span>
          </CardTitle>
          <DateRangePickerAdvanced value={dateRange} onChange={handleDateRangeChange} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="hours" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-primary">
              {totalHours.toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-success">
              {averageHours.toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">Daily Average</p>
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {workDays}
            </p>
            <p className="text-xs text-muted-foreground">Work Days</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimeChartProps {
  className?: string;
  data?: Array<{
    day: string;
    hours: number;
    date: string;
  }>;
  isLoading?: boolean;
}

// Mock data for demonstration
const mockWeekData = [
  { day: 'Mon', hours: 8.5, date: '2025-09-22' },
  { day: 'Tue', hours: 7.2, date: '2025-09-23' },
  { day: 'Wed', hours: 9.1, date: '2025-09-24' },
  { day: 'Thu', hours: 6.8, date: '2025-09-25' },
  { day: 'Fri', hours: 8.0, date: '2025-09-26' },
  { day: 'Sat', hours: 0, date: '2025-09-27' },
  { day: 'Sun', hours: 0, date: '2025-09-28' },
];

export const TimeChart = ({ className, data = mockWeekData, isLoading }: TimeChartProps) => {
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
          <Badge variant="outline" className="text-xs flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Last 7 days</span>
          </Badge>
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

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal Progress</span>
            <span className="font-medium text-foreground">
              {totalHours.toFixed(1)} / 40h
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalHours / 40) * 100, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
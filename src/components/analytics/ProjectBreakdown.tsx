import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Folder, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProjectBreakdownProps {
  className?: string;
  data?: Array<{
    project: string;
    hours: number;
    taskCount: number;
    color: string;
  }>;
  isLoading?: boolean;
}

// Mock data for demonstration
const mockProjectData = [
  { project: 'Frontend', hours: 12.5, taskCount: 8, color: 'hsl(var(--primary))' },
  { project: 'Backend', hours: 8.2, taskCount: 5, color: 'hsl(var(--success))' },
  { project: 'DevOps', hours: 4.1, taskCount: 3, color: 'hsl(var(--warning))' },
  { project: 'Design', hours: 6.3, taskCount: 4, color: 'hsl(var(--destructive))' },
];

export const ProjectBreakdown = ({ 
  className, 
  data = mockProjectData, 
  isLoading 
}: ProjectBreakdownProps) => {
  const totalHours = data.reduce((sum, project) => sum + project.hours, 0);
  const totalTasks = data.reduce((sum, project) => sum + project.taskCount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalHours) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-card-border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.payload.project}</p>
          <p className="text-sm text-primary">
            Hours: <span className="font-medium">{data.value.toFixed(1)}</span> ({percentage}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Tasks: {data.payload.taskCount}
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
            <Folder className="h-5 w-5" />
            <span>Project Breakdown</span>
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
            <Folder className="h-5 w-5" />
            <span>Project Breakdown</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>This week</span>
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

        {/* Project List */}
        <div className="space-y-3">
          {[...data]
            .sort((a, b) => b.hours - a.hours)
            .map((project, index) => {
              const percentage = ((project.hours / totalHours) * 100).toFixed(1);
              return (
                <div key={project.project} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {project.project}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.taskCount} tasks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {project.hours.toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
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
import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTasks } from '../../hooks/useTimeTracking';
import { calculateTodayTotal, calculateWeekTotal, formatHours } from '../../utils/timeCalculations';

export const ReportsSection = () => {
  const { data: tasksData } = useTasks();
  const [generatingReport, setGeneratingReport] = useState<'daily' | 'weekly' | null>(null);

  const tasks = tasksData?.tasks || [];

  // Calculate totals
  const todayTotal = tasks.reduce((acc, task) =>
    acc + calculateTodayTotal(task.tracked_time || {}), 0
  );

  const weekTotal = tasks.reduce((acc, task) =>
    acc + calculateWeekTotal(task.tracked_time || {}), 0
  );

  // Get today's date in DD.MM.YYYY format
  const getToday = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Get week range
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}`;
    };

    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  // Generate report (mock for now - will implement API call later)
  const handleGenerateReport = async (type: 'daily' | 'weekly') => {
    setGeneratingReport(type);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Generating ${type} report...`);
    // TODO: Implement actual report generation API call

    setGeneratingReport(null);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Reports & Exports
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Report */}
        <Card className="card-elevated hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Daily Report
                </CardTitle>
                <CardDescription>
                  Today: {getToday()}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-primary border-primary">
                {formatHours(todayTotal)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generate a detailed report of today's time tracking activities.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                <li className="list-disc">Task breakdown with time spent</li>
                <li className="list-disc">SAP project allocation</li>
                <li className="list-disc">Export to CSV or PDF</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleGenerateReport('daily')}
                disabled={generatingReport === 'daily' || todayTotal === 0}
              >
                {generatingReport === 'daily' ? (
                  <>Generating...</>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={todayTotal === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Report */}
        <Card className="card-elevated hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-success" />
                  Weekly Report
                </CardTitle>
                <CardDescription>
                  This Week: {getWeekRange()}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-success border-success">
                {formatHours(weekTotal)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Generate a comprehensive weekly summary report.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                <li className="list-disc">Daily breakdown for the week</li>
                <li className="list-disc">Project time allocation</li>
                <li className="list-disc">Weekly productivity insights</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => handleGenerateReport('weekly')}
                disabled={generatingReport === 'weekly' || weekTotal === 0}
              >
                {generatingReport === 'weekly' ? (
                  <>Generating...</>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={weekTotal === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

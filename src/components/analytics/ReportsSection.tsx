import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTasks } from '../../hooks/useTimeTracking';
import { calculateWeekTotal, formatHours } from '../../utils/timeCalculations';

export const ReportsSection = () => {
  const { data: tasksData } = useTasks();
  const [generatingReport, setGeneratingReport] = useState(false);

  const tasks = tasksData?.tasks || [];

  // Calculate week total
  const weekTotal = tasks.reduce((acc, task) =>
    acc + calculateWeekTotal(task.tracked_time || {}), 0
  );

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
  const handleGenerateReport = async () => {
    setGeneratingReport(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Generating weekly report...');
    // TODO: Implement actual report generation API call

    setGeneratingReport(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Reports & Exports
      </h2>

      {/* Weekly Report */}
      <Card className="card-elevated hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Report
              </CardTitle>
              <CardDescription>
                Current Week: {getWeekRange()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              {formatHours(weekTotal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive weekly summary report with task breakdown and time allocation.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4">
              <li className="list-disc">Daily breakdown for the week</li>
              <li className="list-disc">Task and project time allocation</li>
              <li className="list-disc">SAP project mapping</li>
              <li className="list-disc">Export to CSV or PDF</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={handleGenerateReport}
              disabled={generatingReport || weekTotal === 0}
            >
              {generatingReport ? (
                <>Generating...</>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
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
    </section>
  );
};

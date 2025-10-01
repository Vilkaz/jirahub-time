import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { DateRangePickerAdvanced, DateRangePreset } from '../ui/date-range-picker-advanced';
import { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek, eachDayOfInterval, format as formatDateFns } from 'date-fns';
import { FileDown, FileJson, Table as TableIcon } from 'lucide-react';
import { useTasks } from '../../hooks/useTimeTracking';
import { DailyReportEntry } from '../../types/api';
import { formatDate } from '../../utils/timeCalculations';
import { cn } from '../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export const ReportsView = () => {
  // Initialize with current week
  const initialRange: DateRange = {
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);
  const { data: tasksData, isLoading } = useTasks();

  const handleDateRangeChange = (range: DateRange | undefined, preset: DateRangePreset) => {
    setDateRange(range);
  };

  // Generate daily breakdown report
  const reportEntries = useMemo((): DailyReportEntry[] => {
    if (!dateRange?.from || !dateRange?.to || !tasksData?.tasks) {
      return [];
    }

    const entries: DailyReportEntry[] = [];

    // Get all dates in the selected range
    const rangeDates = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });
    const rangeDateStrs = new Set(rangeDates.map(d => formatDate(d)));

    // For each task, create entries for each day it has tracked time
    tasksData.tasks.forEach(task => {
      const trackedTime = task.tracked_time || {};

      Object.entries(trackedTime).forEach(([dateStr, seconds]) => {
        // Only include dates in the selected range
        if (rangeDateStrs.has(dateStr) && seconds > 0) {
          // Convert DD.MM.YYYY to YYYY-MM-DD for proper sorting
          const [day, month, year] = dateStr.split('.');
          const isoDate = `${year}-${month}-${day}`;

          entries.push({
            taskKey: task.key,
            taskTitle: task.title,
            sapProjectId: task.sapProject?.id,
            sapProjectName: task.sapProject?.name,
            date: isoDate,
            hours: seconds / 3600, // Convert seconds to hours
          });
        }
      });
    });

    // Sort by date, then by task key
    return entries.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.taskKey.localeCompare(b.taskKey);
    });
  }, [dateRange, tasksData]);

  // Calculate totals
  const totalHours = reportEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueDates = new Set(reportEntries.map(e => e.date));
  const totalDays = uniqueDates.size;

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Task Key', 'Task Title', 'SAP Project ID', 'SAP Project Name', 'Date', 'Hours'];
    const csvRows = [
      headers.join(','),
      ...reportEntries.map(entry =>
        [
          entry.taskKey,
          `"${entry.taskTitle.replace(/"/g, '""')}"`, // Escape quotes in title
          entry.sapProjectId || '',
          entry.sapProjectName ? `"${entry.sapProjectName.replace(/"/g, '""')}"` : '',
          entry.date,
          entry.hours.toFixed(2),
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `timesheet_${formatDateFns(dateRange?.from || new Date(), 'yyyy-MM-dd')}_to_${formatDateFns(dateRange?.to || new Date(), 'yyyy-MM-dd')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    const reportData = {
      startDate: formatDateFns(dateRange?.from || new Date(), 'yyyy-MM-dd'),
      endDate: formatDateFns(dateRange?.to || new Date(), 'yyyy-MM-dd'),
      totalHours,
      totalDays,
      entries: reportEntries,
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `timesheet_${formatDateFns(dateRange?.from || new Date(), 'yyyy-MM-dd')}_to_${formatDateFns(dateRange?.to || new Date(), 'yyyy-MM-dd')}.json`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          SAP Time Reports
        </h1>
        <p className="text-muted-foreground">
          Generate daily breakdown reports for SAP time booking
        </p>
      </div>

      {/* Controls Card */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Select date range and export format</CardDescription>
            </div>
            <DateRangePickerAdvanced value={dateRange} onChange={handleDateRangeChange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Report Summary</p>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-bold text-primary">{reportEntries.length}</span>
                  <span className="text-sm text-muted-foreground ml-2">entries</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-success">{totalHours.toFixed(1)}h</span>
                  <span className="text-sm text-muted-foreground ml-2">total</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{totalDays}</span>
                  <span className="text-sm text-muted-foreground ml-2">days</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                disabled={reportEntries.length === 0}
                variant="outline"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportToJSON}
                disabled={reportEntries.length === 0}
                variant="outline"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TableIcon className="h-5 w-5" />
            <span>Daily Breakdown</span>
          </CardTitle>
          <CardDescription>
            Each row represents one task on one day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : reportEntries.length === 0 ? (
            <div className="text-center py-12">
              <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No time entries found for selected date range</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try selecting a different date range or track some time first
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task Key</TableHead>
                    <TableHead>Task Title</TableHead>
                    <TableHead>SAP Project</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportEntries.map((entry, index) => (
                    <TableRow key={`${entry.taskKey}-${entry.date}-${index}`}>
                      <TableCell className="font-medium">
                        {formatDateFns(new Date(entry.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{entry.taskKey}</span>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {entry.taskTitle}
                      </TableCell>
                      <TableCell>
                        {entry.sapProjectId ? (
                          <div>
                            <p className="font-medium text-sm">{entry.sapProjectId}</p>
                            {entry.sapProjectName && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {entry.sapProjectName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.hours.toFixed(2)}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

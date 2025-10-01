import { useEffect, useState } from 'react';
import { TrackingStatus } from '../components/tracking/TrackingStatus';
import { TaskList } from '../components/tasks/TaskList';
import { TimeChart } from '../components/analytics/TimeChart';
import { ProjectBreakdown } from '../components/analytics/ProjectBreakdown';
import { ReportsView } from '../components/reports/ReportsView';
import { useTimeTracking, useTasks } from '../hooks/useTimeTracking';
import { useTimeStore } from '../stores/timeStore';
import { Task } from '../types/api';
import { toast } from '../hooks/use-toast';
import { calculateTodayTotal, calculateWeekTotal, formatHours } from '../utils/timeCalculations';

export const Dashboard = () => {
  const { startTracking } = useTimeTracking();
  const { activeTask, isTracking, activeSince } = useTimeStore();
  const { data: tasksData } = useTasks();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Initialize the app
  useEffect(() => {
    // Show welcome message on first load
    if (!activeTask && !isTracking) {
      toast({
        title: "Welcome to Work Assistant",
        description: "Select a task from the list to start tracking your time.",
      });
    }
  }, []);

  // Update current time every second when tracking (for real-time stats)
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Calculate today and week totals from all tasks
  const calculateTotals = () => {
    const tasks = tasksData?.tasks || [];
    let todayTotal = 0;
    let weekTotal = 0;

    tasks.forEach(task => {
      const trackedTime = task.tracked_time || {};
      todayTotal += calculateTodayTotal(trackedTime);
      weekTotal += calculateWeekTotal(trackedTime);

      // Add current session time if this is the active task
      if (isTracking && activeTask?.taskId === task.taskId && activeSince) {
        const activeSinceTime = activeSince instanceof Date ? activeSince.getTime() : activeSince;
        const currentSessionSeconds = Math.floor((currentTime - activeSinceTime) / 1000);
        todayTotal += currentSessionSeconds;
        weekTotal += currentSessionSeconds;
      }
    });

    return { todayTotal, weekTotal };
  };

  const { todayTotal, weekTotal } = calculateTotals();

  const handleTaskSelect = (task: Task) => {
    if (isTracking && activeTask) {
      // If already tracking, show confirmation or switch tasks
      toast({
        title: "Switching tasks",
        description: `Switching from ${activeTask.taskId} to ${task.taskId}`,
      });
    }

    startTracking({
      taskId: task.taskId,
      jiraUrl: task.url,
      jiraTitle: task.title
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section - Status */}
          <section className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Time Tracking Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your productivity and manage your time effectively
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrackingStatus />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-status p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{formatHours(todayTotal)}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                  <div className="card-status p-4 text-center">
                    <p className="text-2xl font-bold text-success">{formatHours(weekTotal)}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tasks Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Tasks
            </h2>

            <TaskList onTaskSelect={handleTaskSelect} />
          </section>

          {/* Analytics Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Analytics & Insights
            </h2>

            <div className="grid lg:grid-cols-2 gap-6">
              <TimeChart />
              <ProjectBreakdown />
            </div>
          </section>

          {/* Reports Section */}
          <section className="space-y-4">
            <ReportsView />
          </section>
        </div>
      </main>
    </div>
  );
};
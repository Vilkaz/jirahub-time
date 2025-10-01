import { useEffect } from 'react';
import { TrackingStatus } from '../components/tracking/TrackingStatus';
import { TaskList } from '../components/tasks/TaskList';
import { TimeChart } from '../components/analytics/TimeChart';
import { ProjectBreakdown } from '../components/analytics/ProjectBreakdown';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useTimeStore } from '../stores/timeStore';
import { Task } from '../types/api';
import { toast } from '../hooks/use-toast';

export const Dashboard = () => {
  const { startTracking } = useTimeTracking();
  const { activeTask, isTracking } = useTimeStore();

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
                    <p className="text-2xl font-bold text-primary">4.2h</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                  <div className="card-status p-4 text-center">
                    <p className="text-2xl font-bold text-success">31.5h</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
                <div className="card-status p-4 text-center">
                  <p className="text-xl font-semibold text-foreground">85%</p>
                  <p className="text-xs text-muted-foreground">Weekly Goal Progress</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div className="bg-gradient-primary h-2 rounded-full w-4/5" />
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

          {/* Quick Actions Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Quick Actions
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card-status p-6 text-center space-y-3 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-primary text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-foreground">Generate Report</h3>
                <p className="text-sm text-muted-foreground">
                  Create timesheet for export
                </p>
              </div>
              
              <div className="card-status p-6 text-center space-y-3 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-success text-xl">🔗</span>
                </div>
                <h3 className="font-semibold text-foreground">Jira Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage Jira integration
                </p>
              </div>
              
              <div className="card-status p-6 text-center space-y-3 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-warning text-xl">⚙️</span>
                </div>
                <h3 className="font-semibold text-foreground">Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Configure app settings
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
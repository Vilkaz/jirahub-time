import { useState } from 'react';
import { Save, X, Trash2, Plus, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { LoadingButton } from '../ui/loading-button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Task } from '../../types/api';
import { formatDate, parseDate } from '../../utils/dateUtils';

interface TimeSession {
  date: string; // YYYY-MM-DD format
  hours: number;
  minutes: number;
  description: string; // Session description
}

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, sessions: TimeSession[], sapTask?: string) => Promise<void>;
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSave }: EditTaskDialogProps) => {
  // Convert tracked_time map to sessions array
  const initialSessions: TimeSession[] = Object.entries(task.tracked_time || {})
    .map(([dateStr, sessionData]) => {
      // dateStr format: "01.10.2025" -> convert to "2025-10-01"
      const [day, month, year] = dateStr.split('.');
      const isoDate = `${year}-${month}-${day}`;

      // Handle both old format (number) and new format ({seconds, description})
      let seconds: number;
      let description: string;

      if (typeof sessionData === 'number') {
        // Old format: just seconds
        seconds = sessionData;
        description = '';
      } else {
        // New format: {seconds, description}
        seconds = sessionData.seconds;
        description = sessionData.description || '';
      }

      return {
        date: isoDate,
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        description,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date desc

  const [sessions, setSessions] = useState<TimeSession[]>(initialSessions);
  const [sapTask, setSapTask] = useState(task.sapTask || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSession = () => {
    const today = new Date().toISOString().split('T')[0];
    setSessions([
      { date: today, hours: 0, minutes: 0, description: '' },
      ...sessions,
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleSessionChange = (index: number, field: 'date' | 'hours' | 'minutes' | 'description', value: string) => {
    const newSessions = [...sessions];
    if (field === 'date' || field === 'description') {
      newSessions[index][field] = value;
    } else {
      const numValue = parseInt(value) || 0;
      newSessions[index][field] = Math.max(0, numValue);
    }
    setSessions(newSessions);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(task.taskId, sessions, sapTask.trim() || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalHours = () => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.hours * 60 + s.minutes, 0);
    return (totalMinutes / 60).toFixed(1);
  };

  const formatDisplayDate = (isoDate: string) => {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Time Sessions</span>
            <Badge variant="outline" className="text-xs">
              {task.key}
            </Badge>
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div>{task.title}</div>
            <div className="text-xs">
              Total tracked: <span className="font-semibold">{getTotalHours()}h</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* SAP Task Section */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
            <Label className="text-sm font-medium">SAP Task</Label>
            <div className="space-y-2">
              <Input
                value={sapTask}
                onChange={(e) => setSapTask(e.target.value)}
                placeholder="e.g., PS245-46 - Moro Hub"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the SAP task identifier for reporting and automation
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Time Sessions</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSession}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No time sessions yet. Click "Add Session" to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={index}
                  className="space-y-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={session.date}
                          onChange={(e) =>
                            handleSessionChange(index, 'date', e.target.value)
                          }
                          className="text-sm"
                        />
                        <span className="text-xs text-muted-foreground min-w-[120px]">
                          {formatDisplayDate(session.date)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        value={session.hours}
                        onChange={(e) =>
                          handleSessionChange(index, 'hours', e.target.value)
                        }
                        className="w-20 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={session.minutes}
                        onChange={(e) =>
                          handleSessionChange(index, 'minutes', e.target.value)
                        }
                        className="w-20 text-sm"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSession(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea
                      value={session.description}
                      onChange={(e) =>
                        handleSessionChange(index, 'description', e.target.value)
                      }
                      placeholder="What did you work on during this session?"
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <LoadingButton onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

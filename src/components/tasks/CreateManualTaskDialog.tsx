import { useState } from 'react';
import { Save, X, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CreateManualTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: {
    taskId: string;
    title: string;
    url?: string;
    sapProjectId?: string;
    sapProjectName?: string;
  }) => Promise<void>;
}

export const CreateManualTaskDialog = ({
  open,
  onOpenChange,
  onSave,
}: CreateManualTaskDialogProps) => {
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sapProjectId, setSapProjectId] = useState('');
  const [sapProjectName, setSapProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTaskId('');
    setTitle('');
    setUrl('');
    setSapProjectId('');
    setSapProjectName('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSave = async () => {
    // Validation
    if (!taskId.trim()) {
      setError('Task ID is required');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave({
        taskId: taskId.trim(),
        title: title.trim(),
        url: url.trim() || undefined,
        sapProjectId: sapProjectId.trim() || undefined,
        sapProjectName: sapProjectName.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Manual Task</DialogTitle>
          <DialogDescription>
            Add a task that's not accessible via Jira API (e.g., from a client board)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="taskId">
              Task ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="taskId"
              placeholder="e.g., CLIENT-123"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this task
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Implement user authentication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Task URL (optional)
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://client-jira.atlassian.net/browse/CLIENT-123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Link to the task on external board
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-medium">SAP Project (optional)</Label>

            <div className="space-y-2">
              <Label htmlFor="sapProjectId" className="text-xs text-muted-foreground">
                Project ID
              </Label>
              <Input
                id="sapProjectId"
                placeholder="e.g., SAP-PRJ-2024-001"
                value={sapProjectId}
                onChange={(e) => setSapProjectId(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sapProjectName" className="text-xs text-muted-foreground">
                Project Name
              </Label>
              <Input
                id="sapProjectName"
                placeholder="e.g., Client Portal Development"
                value={sapProjectName}
                onChange={(e) => setSapProjectName(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

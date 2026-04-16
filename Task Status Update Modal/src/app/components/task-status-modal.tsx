import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Clock, User, Check, Timer, TrendingUp, Calendar } from "lucide-react";
import { Task, TaskStatus, StatusHistoryEntry, TimeEntry } from "../types/task";

interface TaskStatusModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, newStatus: TaskStatus) => void;
  onLogTime: (taskId: string, hours: number, note?: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
  "To Do": "bg-slate-500",
  "In Progress": "bg-blue-500",
  "Done": "bg-green-500",
};

const statusIcons: Record<TaskStatus, string> = {
  "To Do": "○",
  "In Progress": "◐",
  "Done": "●",
};

export function TaskStatusModal({ task, isOpen, onClose, onSave, onLogTime }: TaskStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("To Do");
  const [hasChanges, setHasChanges] = useState(false);
  const [hoursToLog, setHoursToLog] = useState("");
  const [timeNote, setTimeNote] = useState("");

  useEffect(() => {
    if (task) {
      setSelectedStatus(task.status);
      setHasChanges(false);
      setHoursToLog("");
      setTimeNote("");
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      setHasChanges(selectedStatus !== task.status);
    }
  }, [selectedStatus, task]);

  const handleSave = () => {
    if (task && hasChanges) {
      onSave(task.id, selectedStatus);
      onClose();
    }
  };

  const handleLogTime = () => {
    if (task && hoursToLog && parseFloat(hoursToLog) > 0) {
      onLogTime(task.id, parseFloat(hoursToLog), timeNote || undefined);
      setHoursToLog("");
      setTimeNote("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!task) return null;

  const totalHoursLogged = task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const remainingHours = task.estimatedHours - totalHoursLogged;
  const progressPercentage = Math.min((totalHoursLogged / task.estimatedHours) * 100, 100);
  const isOverBudget = totalHoursLogged > task.estimatedHours;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Task Details</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{task.title}</p>
        </DialogHeader>

        <Tabs defaultValue="status" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status & History</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Current Status Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{statusIcons[task.status]}</span>
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <p className="font-medium">{task.status}</p>
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <Label htmlFor="status-select" className="text-sm font-medium">
                Update Status
              </Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors["To Do"]}`} />
                      <span>To Do</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="In Progress">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors["In Progress"]}`} />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Done">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors["Done"]}`} />
                      <span>Done</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasChanges && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Status will be updated to <strong>{selectedStatus}</strong>
                </p>
              )}
            </div>

            {/* History Log */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Change History</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {task.statusHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No history available</p>
                ) : (
                  <div className="space-y-3">
                    {task.statusHistory.map((entry: StatusHistoryEntry, index: number) => (
                      <div 
                        key={index} 
                        className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[entry.status]} text-white border-none`}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">{entry.changedBy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(entry.changedAt)}</span>
                          </div>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground italic">"{entry.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
              <p className="font-medium mb-1">💡 Quick Actions:</p>
              <div className="space-y-0.5 ml-4">
                <p><kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">⌘/Ctrl + Enter</kbd> Save changes</p>
                <p><kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">Esc</kbd> Close without saving</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time" className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Time Comparison Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-xs font-medium">Estimated</p>
                </div>
                <p className="text-2xl font-bold">{task.estimatedHours}h</p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Timer className="w-4 h-4" />
                  <p className="text-xs font-medium">Logged</p>
                </div>
                <p className="text-2xl font-bold">{totalHoursLogged.toFixed(1)}h</p>
              </div>
              <div className={`p-4 border rounded-lg ${isOverBudget ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  <Clock className="w-4 h-4" />
                  <p className="text-xs font-medium">Remaining</p>
                </div>
                <p className="text-2xl font-bold">{remainingHours.toFixed(1)}h</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Progress</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-foreground'}`}>
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  ⚠️ Over budget by {(totalHoursLogged - task.estimatedHours).toFixed(1)} hours
                </p>
              )}
            </div>

            <Separator />

            {/* Log Time Form */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Log Time Worked
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours-input">Hours Worked *</Label>
                  <Input
                    id="hours-input"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 2.5"
                    value={hoursToLog}
                    onChange={(e) => setHoursToLog(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-note">Note (optional)</Label>
                  <Textarea
                    id="time-note"
                    placeholder="What did you work on?"
                    value={timeNote}
                    onChange={(e) => setTimeNote(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleLogTime}
                  disabled={!hoursToLog || parseFloat(hoursToLog) <= 0}
                  className="w-full gap-2"
                >
                  <Check className="w-4 h-4" />
                  Log Time
                </Button>
              </div>
            </div>

            {/* Time Entry History */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Time Log History</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {task.timeEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No time logged yet</p>
                ) : (
                  <div className="space-y-3">
                    {[...task.timeEntries].reverse().map((entry: TimeEntry, index: number) => (
                      <div 
                        key={index} 
                        className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Badge variant="secondary" className="font-mono">
                            {entry.hours}h
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">{entry.loggedBy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground italic">"{entry.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Save Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
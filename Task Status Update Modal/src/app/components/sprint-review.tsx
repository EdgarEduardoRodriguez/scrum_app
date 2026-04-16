import { useState } from "react";
import { Task } from "../types/task";
import { Sprint, BurndownDataPoint } from "../types/sprint";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  TrendingDown,
  AlertCircle,
  Calendar,
  Target,
  RotateCcw,
  PartyPopper,
} from "lucide-react";

interface SprintReviewProps {
  sprint: Sprint;
  tasks: Task[];
  onCloseSprint: (taskIdsToBacklog: string[]) => void;
}

export function SprintReview({ sprint, tasks, onCloseSprint }: SprintReviewProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tasksToBacklog, setTasksToBacklog] = useState<Set<string>>(new Set());

  // Filter tasks for this sprint
  const sprintTasks = tasks.filter((task) => sprint.taskIds.includes(task.id));
  const completedTasks = sprintTasks.filter((task) => task.status === "Done");
  const pendingTasks = sprintTasks.filter((task) => task.status !== "Done");

  // Calculate metrics
  const totalTasks = sprintTasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  const completionPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Calculate total hours
  const totalEstimatedHours = sprintTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const totalLoggedHours = sprintTasks.reduce(
    (sum, task) => sum + task.timeEntries.reduce((s, entry) => s + entry.hours, 0),
    0
  );
  const completedTasksHours = completedTasks.reduce(
    (sum, task) => sum + task.timeEntries.reduce((s, entry) => s + entry.hours, 0),
    0
  );

  // Generate burndown chart data
  const burndownData = generateBurndownData(sprint, sprintTasks);

  // Sprint duration
  const sprintDays = Math.ceil(
    (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (new Date().getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, sprintDays - daysElapsed);

  const toggleTaskToBacklog = (taskId: string) => {
    setTasksToBacklog((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCloseSprint = () => {
    onCloseSprint(Array.from(tasksToBacklog));
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Sprint Review
          </h1>
          <p className="text-muted-foreground mt-1">{sprint.name}</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Calendar className="w-4 h-4 mr-2" />
          {daysRemaining} days remaining
        </Badge>
      </div>

      {/* Sprint Goal */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Sprint Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">{sprint.goal}</p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasksHours.toFixed(1)}h logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingTasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-500" />
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{completionPercentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} of {totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Hours Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{totalLoggedHours.toFixed(0)}h</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {totalEstimatedHours}h estimated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Achievement</CardTitle>
          <CardDescription>Overall sprint completion progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-lg">{completionPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-6 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${completionPercentage}%` }}
              >
                {completionPercentage > 10 && (
                  <span className="text-xs font-bold text-white">
                    {completionPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          {completionPercentage >= 100 && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <PartyPopper className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 font-medium">
                🎉 Congratulations! All sprint tasks completed!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Burndown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Burndown Chart</CardTitle>
          <CardDescription>Task completion trend over sprint duration</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                label={{ value: "Tasks Remaining", angle: -90, position: "insideLeft" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                name="Ideal"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Actual"
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Completed Tasks ({completedCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {completedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed tasks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {completedTasks.map((task) => {
                    const hoursLogged = task.timeEntries.reduce((sum, e) => sum + e.hours, 0);
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{task.assignee}</span>
                              <span>•</span>
                              <span>{hoursLogged.toFixed(1)}h logged</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Pending Tasks ({pendingCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All tasks completed! 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => {
                    const isMarkedForBacklog = tasksToBacklog.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                          isMarkedForBacklog
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40"
                        }`}
                        onClick={() => toggleTaskToBacklog(task.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{task.title}</p>
                              {isMarkedForBacklog && (
                                <Badge variant="outline" className="text-xs">
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  To Backlog
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{task.assignee}</span>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            className={
                              task.priority === "High"
                                ? "bg-red-500 text-white"
                                : task.priority === "Medium"
                                ? "bg-yellow-500 text-white"
                                : "bg-gray-500 text-white"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Return to Backlog Section */}
      {pendingCount > 0 && (
        <Card className="border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              Tasks Returning to Backlog
            </CardTitle>
            <CardDescription>
              Click on pending tasks above to mark them for return to backlog
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksToBacklog.size === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No tasks selected. Click on pending tasks to mark them for backlog.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {tasksToBacklog.size} task{tasksToBacklog.size !== 1 ? "s" : ""} will be returned
                  to backlog:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(tasksToBacklog).map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    return (
                      <Badge key={taskId} variant="secondary" className="bg-blue-500/10">
                        {task?.title}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Close Sprint Button */}
      <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg border">
        <div>
          <h3 className="font-semibold text-lg">Ready to close this sprint?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount > 0
              ? `${pendingCount} pending task${pendingCount !== 1 ? "s" : ""} will need to be handled`
              : "All tasks completed! Great work!"}
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setIsConfirmOpen(true)}
          className="gap-2"
          variant={completionPercentage >= 100 ? "default" : "outline"}
        >
          <CheckCircle2 className="w-5 h-5" />
          Close Sprint
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirm Sprint Closure</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>Are you sure you want to close "{sprint.name}"?</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Completed Tasks:</span>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {completedCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Pending Tasks:</span>
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    {pendingCount}
                  </Badge>
                </div>
                {tasksToBacklog.size > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Moving to Backlog:</span>
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                      {tasksToBacklog.size}
                    </Badge>
                  </div>
                )}
              </div>

              {pendingCount > 0 && tasksToBacklog.size === 0 && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: You have {pendingCount} pending task{pendingCount !== 1 ? "s" : ""} that
                    haven't been marked for backlog. They will remain unassigned.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseSprint} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Close Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to generate burndown chart data
function generateBurndownData(sprint: Sprint, tasks: Task[]): BurndownDataPoint[] {
  const sprintDays = Math.ceil(
    (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalTasks = tasks.length;
  const data: BurndownDataPoint[] = [];

  for (let i = 0; i <= sprintDays; i++) {
    const currentDate = new Date(sprint.startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const ideal = Math.max(0, totalTasks - (totalTasks / sprintDays) * i);
    
    // Simulate actual burndown (in real app, this would be based on actual task completion dates)
    let actual: number;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;
    const progressRatio = Math.min(i / sprintDays, 1);
    const currentProgress = completedTasks / totalTasks;
    
    // Create a realistic burndown curve
    if (i === 0) {
      actual = totalTasks;
    } else if (currentDate > new Date()) {
      // Future dates - project based on current velocity
      const tasksPerDay = completedTasks / Math.min(i, sprintDays);
      actual = Math.max(0, totalTasks - tasksPerDay * i);
    } else {
      // Past dates - show actual progress with some variance
      actual = Math.max(0, totalTasks - (totalTasks * currentProgress * progressRatio));
    }

    data.push({
      day: `Day ${i}`,
      date: currentDate,
      ideal: Math.round(ideal * 10) / 10,
      actual: Math.round(actual * 10) / 10,
    });
  }

  return data;
}

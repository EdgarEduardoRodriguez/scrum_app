import { Task, TaskStatus } from "../types/task";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, User } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const columns: { status: TaskStatus; color: string }[] = [
  { status: "To Do", color: "border-slate-500" },
  { status: "In Progress", color: "border-blue-500" },
  { status: "Done", color: "border-green-500" },
];

const priorityColors = {
  Low: "bg-gray-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
};

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        return (
          <div key={column.status} className="flex flex-col h-full">
            <div className={`border-t-4 ${column.color} rounded-t-lg bg-muted/50 p-4`}>
              <h3 className="font-semibold text-lg flex items-center justify-between">
                {column.status}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4 bg-muted/20 rounded-b-lg border border-t-0">
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary/50"
                    onClick={() => onTaskClick(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-medium leading-tight">
                          {task.title}
                        </CardTitle>
                        <Badge
                          className={`${priorityColors[task.priority]} text-white text-xs flex-shrink-0`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(task.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

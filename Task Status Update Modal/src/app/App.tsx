import { useState } from "react";
import { KanbanBoard } from "./components/kanban-board";
import { TaskStatusModal } from "./components/task-status-modal";
import { SprintReview } from "./components/sprint-review";
import { Task, TaskStatus } from "./types/task";
import { mockTasks } from "./data/mock-tasks";
import { currentSprint } from "./data/mock-sprint";
import { CheckSquare, LayoutDashboard } from "lucide-react";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<"board" | "review">("board");

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          // Add new history entry
          const newHistoryEntry = {
            status: newStatus,
            changedAt: new Date(),
            changedBy: "Current User", // In a real app, this would be the logged-in user
            note: `Status changed from ${task.status} to ${newStatus}`,
          };

          return {
            ...task,
            status: newStatus,
            statusHistory: [...task.statusHistory, newHistoryEntry],
          };
        }
        return task;
      })
    );

    // Show success toast
    toast.success("Status updated successfully", {
      description: `Task moved to ${newStatus}`,
    });
  };

  const handleLogTime = (taskId: string, hours: number, note?: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          // Add new time entry
          const newTimeEntry = {
            date: new Date(),
            hours,
            note,
            loggedBy: "Current User", // In a real app, this would be the logged-in user
          };

          // Update the selected task to reflect the changes
          const updatedTask = {
            ...task,
            timeEntries: [...task.timeEntries, newTimeEntry],
          };

          // Update selectedTask if it's the same task
          if (selectedTask?.id === taskId) {
            setSelectedTask(updatedTask);
          }

          return updatedTask;
        }
        return task;
      })
    );

    // Show success toast
    toast.success("Time logged successfully", {
      description: `Logged ${hours} hour${hours !== 1 ? 's' : ''} to the task`,
    });
  };

  const handleCloseSprint = (taskIdsToBacklog: string[]) => {
    // In a real app, this would update the sprint status and move tasks to backlog
    toast.success("Sprint closed successfully!", {
      description: `${taskIdsToBacklog.length} task${taskIdsToBacklog.length !== 1 ? 's' : ''} moved to backlog`,
    });
    
    // Simulate moving tasks back to "To Do" status for backlog
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (taskIdsToBacklog.includes(task.id)) {
          return {
            ...task,
            status: "To Do" as TaskStatus,
            statusHistory: [
              ...task.statusHistory,
              {
                status: "To Do" as TaskStatus,
                changedAt: new Date(),
                changedBy: "System",
                note: "Moved to backlog during sprint closure",
              },
            ],
          };
        }
        return task;
      })
    );
    
    // Switch back to board view
    setTimeout(() => {
      setActiveView("board");
    }, 1500);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing selected task for smooth animation
    setTimeout(() => setSelectedTask(null), 200);
  };

  return (
    <div className="size-full bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Developer Task Board</h1>
                <p className="text-sm text-muted-foreground">
                  {activeView === "board" 
                    ? "Click on any task to update its status" 
                    : "Review and close the current sprint"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === "board" ? "default" : "outline"}
                onClick={() => setActiveView("board")}
                className="gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Task Board
              </Button>
              <Button
                variant={activeView === "review" ? "default" : "outline"}
                onClick={() => setActiveView("review")}
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Sprint Review
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 h-[calc(100vh-88px)] overflow-y-auto">
        {activeView === "board" ? (
          <div className="h-full">
            <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        ) : (
          <SprintReview 
            sprint={currentSprint} 
            tasks={tasks} 
            onCloseSprint={handleCloseSprint}
          />
        )}
      </main>

      {/* Task Status Modal */}
      <TaskStatusModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStatus}
        onLogTime={handleLogTime}
      />
    </div>
  );
}
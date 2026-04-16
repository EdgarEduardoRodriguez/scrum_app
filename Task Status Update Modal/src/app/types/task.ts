export type TaskStatus = "To Do" | "In Progress" | "Done";

export interface StatusHistoryEntry {
  status: TaskStatus;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface TimeEntry {
  date: Date;
  hours: number;
  note?: string;
  loggedBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "Low" | "Medium" | "High";
  assignee: string;
  createdAt: Date;
  statusHistory: StatusHistoryEntry[];
  estimatedHours: number;
  timeEntries: TimeEntry[];
}
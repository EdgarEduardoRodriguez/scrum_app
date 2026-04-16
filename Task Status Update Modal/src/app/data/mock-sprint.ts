import { Sprint } from "../types/sprint";

export const currentSprint: Sprint = {
  id: "sprint-2024-03",
  name: "Sprint 12 - March 2026",
  startDate: new Date(2026, 2, 1), // March 1, 2026
  endDate: new Date(2026, 2, 15), // March 15, 2026
  goal: "Deliver core authentication features, optimize performance, and improve developer documentation",
  totalStoryPoints: 34,
  status: "active",
  taskIds: [
    "task-1", // In Progress
    "task-2", // To Do
    "task-3", // Done
    "task-4", // To Do
    "task-5", // In Progress
    "task-6", // Done
    "task-7", // To Do
    "task-8", // In Progress
  ],
};

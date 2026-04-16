import { Task } from "../types/task";

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Implement user authentication",
    description: "Set up JWT-based authentication with refresh tokens and secure session management",
    status: "In Progress",
    priority: "High",
    assignee: "Sarah Chen",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        changedBy: "Sarah Chen",
        note: "Initial task creation",
      },
      {
        status: "In Progress",
        changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        changedBy: "Sarah Chen",
        note: "Started working on JWT implementation",
      },
    ],
    estimatedHours: 16,
    timeEntries: [
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        hours: 4,
        note: "Set up JWT library and basic authentication flow",
        loggedBy: "Sarah Chen",
      },
      {
        date: new Date(Date.now() - 6 * 60 * 60 * 1000),
        hours: 3.5,
        note: "Implemented refresh token mechanism",
        loggedBy: "Sarah Chen",
      },
    ],
  },
  {
    id: "task-2",
    title: "Fix responsive layout on mobile",
    description: "Header navigation breaks on screens smaller than 768px. Need to implement hamburger menu",
    status: "To Do",
    priority: "Medium",
    assignee: "Alex Kumar",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        changedBy: "Mike Rodriguez",
        note: "Bug reported by QA team",
      },
    ],
    estimatedHours: 4,
    timeEntries: [],
  },
  {
    id: "task-3",
    title: "Optimize database queries",
    description: "Dashboard is loading slowly due to inefficient queries. Add proper indexing and query optimization",
    status: "Done",
    priority: "High",
    assignee: "Jamie Lee",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        changedBy: "Jamie Lee",
      },
      {
        status: "In Progress",
        changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        changedBy: "Jamie Lee",
        note: "Analyzing slow queries",
      },
      {
        status: "Done",
        changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        changedBy: "Jamie Lee",
        note: "Added composite indexes, reduced load time by 60%",
      },
    ],
    estimatedHours: 12,
    timeEntries: [
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        hours: 6,
        note: "Query analysis and profiling",
        loggedBy: "Jamie Lee",
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        hours: 4,
        note: "Created composite indexes",
        loggedBy: "Jamie Lee",
      },
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        hours: 3,
        note: "Testing and validation",
        loggedBy: "Jamie Lee",
      },
    ],
  },
  {
    id: "task-4",
    title: "Add dark mode support",
    description: "Implement theme switcher with dark mode styles across all components",
    status: "To Do",
    priority: "Low",
    assignee: "Chris Park",
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 30 * 60 * 1000),
        changedBy: "Chris Park",
      },
    ],
    estimatedHours: 8,
    timeEntries: [],
  },
  {
    id: "task-5",
    title: "Update API documentation",
    description: "Document new endpoints and update OpenAPI specs for v2 of the API",
    status: "In Progress",
    priority: "Medium",
    assignee: "Taylor Swift",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        changedBy: "Sarah Chen",
        note: "Assigned to Taylor for documentation",
      },
      {
        status: "In Progress",
        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        changedBy: "Taylor Swift",
        note: "Working on endpoint documentation",
      },
    ],
    estimatedHours: 6,
    timeEntries: [
      {
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        hours: 2.5,
        note: "Documented authentication endpoints",
        loggedBy: "Taylor Swift",
      },
    ],
  },
  {
    id: "task-6",
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment to staging/production",
    status: "Done",
    priority: "High",
    assignee: "Mike Rodriguez",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        changedBy: "Mike Rodriguez",
      },
      {
        status: "In Progress",
        changedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        changedBy: "Mike Rodriguez",
        note: "Setting up GitHub Actions workflow",
      },
      {
        status: "Done",
        changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        changedBy: "Mike Rodriguez",
        note: "Pipeline complete with automated tests and deployments",
      },
    ],
    estimatedHours: 10,
    timeEntries: [
      {
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        hours: 5,
        note: "Initial GitHub Actions setup",
        loggedBy: "Mike Rodriguez",
      },
      {
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        hours: 4,
        note: "Configured deployment workflows",
        loggedBy: "Mike Rodriguez",
      },
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        hours: 2,
        note: "Testing and documentation",
        loggedBy: "Mike Rodriguez",
      },
    ],
  },
  {
    id: "task-7",
    title: "Implement file upload feature",
    description: "Add drag-and-drop file upload with progress tracking and preview functionality",
    status: "To Do",
    priority: "Medium",
    assignee: "Alex Kumar",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        changedBy: "Sarah Chen",
        note: "Feature requested by product team",
      },
    ],
    estimatedHours: 8,
    timeEntries: [],
  },
  {
    id: "task-8",
    title: "Write unit tests for payment module",
    description: "Achieve 80% code coverage for payment processing logic and error handling",
    status: "In Progress",
    priority: "High",
    assignee: "Jamie Lee",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    statusHistory: [
      {
        status: "To Do",
        changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        changedBy: "Jamie Lee",
      },
      {
        status: "In Progress",
        changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        changedBy: "Jamie Lee",
        note: "Currently at 65% coverage",
      },
    ],
    estimatedHours: 14,
    timeEntries: [
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        hours: 4,
        note: "Set up test framework and initial tests",
        loggedBy: "Jamie Lee",
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hours: 5.5,
        note: "Added tests for error handling scenarios",
        loggedBy: "Jamie Lee",
      },
      {
        date: new Date(Date.now() - 4 * 60 * 60 * 1000),
        hours: 3,
        note: "Edge case testing",
        loggedBy: "Jamie Lee",
      },
    ],
  },
];
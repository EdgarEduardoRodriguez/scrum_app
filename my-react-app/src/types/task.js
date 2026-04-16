export const TaskStatus = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export class StatusHistoryEntry {
  constructor(status, changedAt, changedBy, note = null) {
    this.status = status;
    this.changedAt = changedAt;
    this.changedBy = changedBy;
    this.note = note;
  }
}

export class TimeEntry {
  constructor(date, hours, loggedBy, note = null) {
    this.date = date;
    this.hours = hours;
    this.loggedBy = loggedBy;
    this.note = note;
  }
}

export class Task {
  constructor(
    id,
    title,
    description,
    status,
    priority,
    assignee,
    createdAt,
    statusHistory,
    estimatedHours,
    timeEntries
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.assignee = assignee;
    this.createdAt = createdAt;
    this.statusHistory = statusHistory;
    this.estimatedHours = estimatedHours;
    this.timeEntries = timeEntries;
  }
}

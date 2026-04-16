export class Sprint {
  constructor(id, name, startDate, endDate, goal, totalStoryPoints, status, taskIds) {
    this.id = id;
    this.name = name;
    this.startDate = startDate;
    this.endDate = endDate;
    this.goal = goal;
    this.totalStoryPoints = totalStoryPoints;
    this.status = status;
    this.taskIds = taskIds;
  }
}

export class BurndownDataPoint {
  constructor(day, date, ideal, actual) {
    this.day = day;
    this.date = date;
    this.ideal = ideal;
    this.actual = actual;
  }
}

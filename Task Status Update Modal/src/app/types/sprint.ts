export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  goal: string;
  totalStoryPoints: number;
  status: "active" | "completed" | "planning";
  taskIds: string[];
}

export interface BurndownDataPoint {
  day: string;
  date: Date;
  ideal: number;
  actual: number;
}

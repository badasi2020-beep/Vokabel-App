export interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Task {
  id: string;
  name: string;
  categoryId: string;
  room?: string;
  description?: string;
  points: number | null;
  repeatDays: number | null;
  timerEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Snapshot-Felder (taskNameSnapshot, pointsSnapshot, ...) bleiben unverändert,
// auch wenn sich die Aufgabe später ändert - das ist die Dokumentation von damals.
export interface Completion {
  id: string;
  taskId: string;
  taskNameSnapshot: string;
  personId: string;
  personNameSnapshot: string;
  categoryId: string;
  categoryNameSnapshot: string;
  pointsSnapshot: number | null;
  completedAt: string;
  durationSeconds?: number;
}

export interface Activity {
  id: string;
  name: string;
  points: number;
  personId: string;
  categoryId: string;
  createdAt: string;
  durationSeconds?: number;
}

export interface TaskChange {
  id: string;
  taskId: string;
  taskName: string;
  changedAt: string;
  personId: string;
  personName: string;
  before: string;
  after: string;
}

export interface Store {
  people: Person[];
  categories: Category[];
  tasks: Task[];
  completions: Completion[];
  activities: Activity[];
  changes: TaskChange[];
  activePersonId: string;
  weeklyPrize: string;
}

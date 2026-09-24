export interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
  // Preis, den diese Person gewinnen kann - wird von der jeweils anderen Person festgelegt.
  prize: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// alltag: taglicher Kram (z.B. Spülmaschine) - bleibt immer sichtbar, nur in Kategorien, nicht auf der Startseite.
// putzplan: zählt für den persönlichen Wochenpreis der zugewiesenen Person.
// sonstiges: alles andere ("nicht alltägliches").
export type TaskKind = "alltag" | "putzplan" | "sonstiges";

export interface Task {
  id: string;
  name: string;
  categoryId: string;
  room?: string;
  description?: string;
  points: number | null;
  repeatDays: number | null;
  timerEnabled: boolean;
  taskKind: TaskKind;
  // Dauerhafte Zuweisung. null = niemandem zugewiesen (für alle offen).
  assignedPersonId: string | null;
  // Zuweisung nur für die nächste Erledigung (bei Alltagsaufgaben: "nur dieses Mal").
  // Wird nach der nächsten Erledigung wieder auf null zurückgesetzt.
  tempAssignedPersonId: string | null;
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
  taskKindSnapshot: TaskKind;
  pointsSnapshot: number | null;
  completedAt: string;
  durationSeconds?: number;
  // Gesetzt, wenn diese Erledigung eine Übernahme einer fremd zugewiesenen Aufgabe war -
  // die ursprünglich zugewiesene Person verliert dadurch die gleiche Punktzahl.
  takeoverFromPersonId?: string | null;
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
}

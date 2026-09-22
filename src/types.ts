// Zentrale Datentypen für "Gemeinsam".
// Bewusst so gebaut, dass jede Entität eine stabile `id` hat und History-Einträge
// unabhängig von späteren Änderungen an Aufgaben/Kategorien bleiben (Snapshot-Prinzip),
// damit ein Umzug auf eine gemeinsame Cloud-Datenbank später keine Datenmodell-Änderung braucht.

export type ID = string;

export interface Person {
  id: ID;
  name: string;
  color: string; // für kleine Avatare/Badges
}

export interface Category {
  id: ID;
  name: string;
  icon: string; // Emoji als einfaches, dependency-freies Icon
}

export type RecurrenceUnit = "day" | "week" | "month" | "year";

export interface Recurrence {
  unit: RecurrenceUnit;
  interval: number; // z.B. unit="day", interval=7 => alle 7 Tage
  // Optional: fester Wochentag (0=So..6=Sa) für wiederkehrende Termine
  weekday?: number;
  // Optional: feste Uhrzeit "HH:MM"
  time?: string;
}

export interface Task {
  id: ID;
  name: string;
  categoryId: ID | null;
  description?: string;
  points?: number; // undefined/null = keine Punkte hinterlegt
  recurrence?: Recurrence | null; // null/undefined = einmalige/Ad-hoc-Aufgabe
  archived?: boolean;
  createdAt: string; // ISO
  // Letzte Erledigung wird aus der History abgeleitet, nicht hier gespeichert,
  // damit es nur eine Quelle der Wahrheit gibt.
}

export interface HistoryEntry {
  id: ID;
  taskId: ID;
  // Snapshot-Felder: bleiben unverändert, auch wenn sich die Aufgabe später ändert.
  taskName: string;
  categoryId: ID | null;
  points: number | null; // Punktwert zum Zeitpunkt der Erledigung, null = keine Punkte
  personId: ID;
  completedAt: string; // ISO-Zeitstempel
  durationSeconds?: number; // optional, aus Timer oder manueller Eingabe
}

export interface AppData {
  people: Person[];
  categories: Category[];
  tasks: Task[];
  history: HistoryEntry[];
  activePersonId: ID;
  weeklyMoment?: string; // freitextlicher "Wochenmoment"
}

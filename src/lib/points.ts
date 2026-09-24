import type { Activity, Completion, Task } from "../types";

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Montag = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Tatsächliche Punkte einer Person in einem Zeitraum: eigene Erledigungen + Aktivitäten,
// minus Abzug für Aufgaben, die ihr zugewiesen waren, aber von der anderen Person übernommen wurden.
// Alltagsaufgaben zählen hier bewusst nicht mit (siehe Statistik: die werden separat gezeigt
// und sollen den Wochenvergleich/Extra-Preis nicht durch häufige Routine-Häkchen verzerren).
export function pointsForPerson(personId: string, completions: Completion[], activities: Activity[], since: Date): number {
  const relevant = completions.filter((c) => c.taskKindSnapshot !== "alltag");
  const earned = relevant
    .filter((c) => c.personId === personId && new Date(c.completedAt) >= since)
    .reduce((sum, c) => sum + (c.pointsSnapshot || 0), 0);
  const fromActivities = activities
    .filter((a) => a.personId === personId && new Date(a.createdAt) >= since)
    .reduce((sum, a) => sum + a.points, 0);
  const penalty = relevant
    .filter((c) => c.takeoverFromPersonId === personId && new Date(c.completedAt) >= since)
    .reduce((sum, c) => sum + (c.pointsSnapshot || 0), 0);
  return earned + fromActivities - penalty;
}

/**
 * Hat diese Person alle ihr zugewiesenen Putzplan-Aufgaben diese Woche selbst erledigt?
 * - null: keine Putzplan-Aufgaben zugewiesen (Preis nicht anwendbar).
 * - false: mind. eine noch offen, oder eine wurde von der anderen Person übernommen.
 * - true: alle erledigt, keine Übernahme.
 */
export function wonOwnPutzplan(personId: string, tasks: Task[], completions: Completion[], weekStart: Date): boolean | null {
  const assigned = tasks.filter((t) => t.taskKind === "putzplan" && t.assignedPersonId === personId);
  if (assigned.length === 0) return null;

  const disqualified = completions.some(
    (c) =>
      c.takeoverFromPersonId === personId &&
      new Date(c.completedAt) >= weekStart &&
      assigned.some((t) => t.id === c.taskId)
  );
  if (disqualified) return false;

  return assigned.every((task) => completions.some((c) => c.taskId === task.id && new Date(c.completedAt) >= weekStart));
}

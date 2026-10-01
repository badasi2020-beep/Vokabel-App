import type { Activity, Completion, Person, Task } from "../types";

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Montag = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Preise gelten immer nur für die Woche, in der sie zuletzt (neu) gespeichert wurden -
// jede Woche muss der Preis neu festgelegt/bestätigt werden.
export function isPrizeCurrent(person: Person, weekStart: Date = startOfWeek()): boolean {
  return !!person.prize.trim() && person.prizeWeekStart === isoDate(weekStart);
}

// Tatsächliche Punkte einer Person in einem Zeitraum: alle Erledigungen (auch Alltag) + Aktivitäten,
// minus Abzug für Aufgaben, die ihr zugewiesen waren, aber von der anderen Person übernommen wurden.
// Die Statistik-Seite zeigt Alltagsaufgaben separat ausgewiesen, zählt sie aber in diese
// Gesamtpunktzahl mit ein - danach bemisst sich auch der Extra-Preis.
export function pointsForPerson(personId: string, completions: Completion[], activities: Activity[], since: Date): number {
  const relevant = completions;
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

import type { HistoryEntry, Recurrence, Task } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

function addInterval(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date);
  switch (recurrence.unit) {
    case "day":
      next.setDate(next.getDate() + recurrence.interval);
      break;
    case "week":
      next.setDate(next.getDate() + recurrence.interval * 7);
      break;
    case "month":
      next.setMonth(next.getMonth() + recurrence.interval);
      break;
    case "year":
      next.setFullYear(next.getFullYear() + recurrence.interval);
      break;
  }
  return next;
}

export function lastCompletedAt(taskId: string, history: HistoryEntry[]): Date | null {
  let latest: Date | null = null;
  for (const entry of history) {
    if (entry.taskId !== taskId) continue;
    const d = new Date(entry.completedAt);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Nächster Fälligkeitstermin einer wiederkehrenden Aufgabe.
 * Ohne bisherige Erledigung gilt sie sofort als fällig (createdAt als Basis).
 */
export function nextDueDate(task: Task, history: HistoryEntry[]): Date | null {
  if (!task.recurrence) return null;
  const last = lastCompletedAt(task.id, history);
  const base = last ?? new Date(task.createdAt);
  if (!last) return base; // noch nie erledigt -> sofort fällig
  return addInterval(base, task.recurrence);
}

export function isDue(task: Task, history: HistoryEntry[], now: Date = new Date()): boolean {
  const due = nextDueDate(task, history);
  if (!due) return false;
  return due.getTime() <= now.getTime();
}

export function daysUntilDue(task: Task, history: HistoryEntry[], now: Date = new Date()): number | null {
  const due = nextDueDate(task, history);
  if (!due) return null;
  return Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
}

export function recurrenceLabel(recurrence: Recurrence | null | undefined): string {
  if (!recurrence) return "Einmalig";
  const { unit, interval } = recurrence;
  const unitLabels: Record<Recurrence["unit"], [string, string]> = {
    day: ["Tag", "Tage"],
    week: ["Woche", "Wochen"],
    month: ["Monat", "Monate"],
    year: ["Jahr", "Jahre"]
  };
  const [singular, plural] = unitLabels[unit];
  if (interval === 1) {
    if (unit === "day") return "Täglich";
    return `Jede${unit === "week" ? "" : "n"} ${singular}`;
  }
  return `Alle ${interval} ${plural}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sonntag
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

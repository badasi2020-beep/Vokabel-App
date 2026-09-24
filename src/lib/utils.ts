import type { Completion, Task } from "../types";

export function relativeDate(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000
  );
  if (diff === 0) return "heute";
  if (diff === 1) return "gestern";
  if (diff < 7) return `vor ${diff} Tagen`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export function dateTime(date: string): string {
  return new Date(date).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function isDue(task: Task, completions: Completion[]): boolean {
  // Alltagsaufgaben bleiben immer aktionierbar - sie verschwinden nie, auch nicht nach dem Abhaken.
  if (task.taskKind === "alltag") return true;
  if (!task.repeatDays) return true;
  const last = completions
    .filter((item) => item.taskId === task.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  return !last || Date.now() - new Date(last.completedAt).getTime() >= task.repeatDays * 86400000;
}

// Wer eine Aufgabe aktuell erledigen soll: die einmalige Zuweisung geht vor der dauerhaften.
export function currentAssignee(task: Task): string | null {
  return task.tempAssignedPersonId ?? task.assignedPersonId;
}

// Startseiten-Filter: Alltagsaufgaben nie, sonst nur eigene bzw. nicht zugewiesene Aufgaben.
export function visibleForPerson(task: Task, personId: string): boolean {
  if (task.taskKind === "alltag") return false;
  const assignee = currentAssignee(task);
  return assignee === null || assignee === personId;
}

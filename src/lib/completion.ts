import { currentAssignee } from "./utils";
import { makeId } from "../store";
import type { Category, Completion, Person, Task } from "../types";

// Baut den Historieneintrag für eine Erledigung. Weicht die ausführende Person von der
// zugewiesenen Person ab, wird das als Übernahme markiert (Punkteabzug bei der ursprünglich
// zugewiesenen Person, siehe lib/points.ts). Einmalige Zuweisungen werden danach zurückgesetzt.
export function buildCompletion(
  task: Task,
  person: Person,
  category: Category | undefined,
  seconds?: number
): { completion: Completion; clearTempAssignment: boolean } {
  const assignee = currentAssignee(task);
  const takeoverFromPersonId = assignee && assignee !== person.id ? assignee : null;
  const completion: Completion = {
    id: makeId("completion"),
    taskId: task.id,
    taskNameSnapshot: task.name,
    personId: person.id,
    personNameSnapshot: person.name,
    categoryId: task.categoryId,
    categoryNameSnapshot: category?.name || "Sonstiges",
    taskKindSnapshot: task.taskKind,
    pointsSnapshot: task.points,
    completedAt: new Date().toISOString(),
    ...(seconds ? { durationSeconds: seconds } : {}),
    ...(takeoverFromPersonId ? { takeoverFromPersonId } : {})
  };
  return { completion, clearTempAssignment: !!task.tempAssignedPersonId };
}

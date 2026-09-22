import { useStore } from "../store/store";
import type { Task } from "../types";
import { daysUntilDue, isDue, recurrenceLabel } from "../lib/recurrence";

export function TaskRow({
  task,
  onComplete,
  onInfo
}: {
  task: Task;
  onComplete: (task: Task) => void;
  onInfo: (task: Task) => void;
}) {
  const { data } = useStore();
  const category = data.categories.find((c) => c.id === task.categoryId);
  const due = task.recurrence ? isDue(task, data.history) : true;
  const days = task.recurrence ? daysUntilDue(task, data.history) : null;

  let dueLabel: string | null = null;
  if (task.recurrence) {
    if (days === null) dueLabel = null;
    else if (days <= 0) dueLabel = days === 0 ? "Heute fällig" : `${Math.abs(days)} Tag(e) überfällig`;
    else dueLabel = `In ${days} Tag(en) fällig`;
  }

  return (
    <div className="flex items-center gap-3 bg-cream-soft rounded-card shadow-card px-4 py-3">
      <button
        onClick={() => onComplete(task)}
        aria-label={`${task.name} erledigt`}
        className="h-9 w-9 shrink-0 rounded-full border-2 border-forest flex items-center justify-center text-forest"
      >
        ✓
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-forest truncate">{task.name}</p>
        <p className="text-xs text-forest-soft truncate">
          {category ? `${category.icon} ${category.name} · ` : ""}
          {recurrenceLabel(task.recurrence)}
          {dueLabel ? ` · ${dueLabel}` : ""}
        </p>
      </div>
      {typeof task.points === "number" && (
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-pill ${
            task.points >= 0 ? "bg-cream-deep text-forest" : "bg-clay/15 text-clay"
          }`}
        >
          {task.points > 0 ? `+${task.points}` : task.points}
        </span>
      )}
      <button
        onClick={() => onInfo(task)}
        aria-label={`Details zu ${task.name}`}
        className="h-8 w-8 shrink-0 rounded-full text-forest-soft flex items-center justify-center"
      >
        ⓘ
      </button>
      {task.recurrence && !due && (
        <span className="sr-only">Noch nicht fällig</span>
      )}
    </div>
  );
}

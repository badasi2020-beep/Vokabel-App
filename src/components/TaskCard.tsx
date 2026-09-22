import { Check, Pencil, Timer } from "lucide-react";
import type { Category, Task } from "../types";

export function TaskCard({
  task,
  category,
  due = true,
  onComplete,
  onEdit,
  running,
  onStart
}: {
  task: Task;
  category?: Category;
  due?: boolean;
  onComplete: (task: Task, seconds?: number) => void;
  onEdit?: (task: Task) => void;
  running?: number | null;
  onStart?: (task: Task) => void;
}) {
  return (
    <div className="task-row" data-testid={`card-task-${task.id}`}>
      <button
        className={`task-check ${!due ? "done" : ""}`}
        disabled={!due}
        onClick={() => onComplete(task)}
        data-testid={`button-complete-${task.id}`}
        title="Als erledigt markieren"
      >
        {!due && <Check size={15} />}
      </button>
      <div className="task-main">
        <div className="task-name">{task.name}</div>
        <div className="task-detail">
          <span className="category-dot" />
          {category?.name}
          {task.room ? ` · ${task.room}` : ""}
          {!due && <span className="tag">erledigt</span>}
        </div>
      </div>
      {task.timerEnabled && due && (
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onStart?.(task)}
          data-testid={`button-timer-${task.id}`}
          title={running !== null && running !== undefined ? "Timer läuft" : "Timer starten"}
        >
          {running !== null && running !== undefined ? (
            <span style={{ fontSize: 11 }}>{Math.floor((Date.now() - running) / 1000)}s</span>
          ) : (
            <Timer size={17} />
          )}
        </button>
      )}
      {task.points !== null ? (
        <span className="task-points">+{task.points}</span>
      ) : (
        <span className="task-points muted">ohne Punkte</span>
      )}
      {onEdit && (
        <button className="btn btn-ghost btn-icon" onClick={() => onEdit(task)} data-testid={`button-edit-${task.id}`}>
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
}

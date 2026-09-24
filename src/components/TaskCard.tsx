import { Check, Pencil, Timer, UserPlus } from "lucide-react";
import { currentAssignee } from "../lib/utils";
import type { Category, Person, Task } from "../types";

const kindLabels: Record<Task["taskKind"], string> = {
  alltag: "Alltag",
  putzplan: "Putzplan",
  sonstiges: "Nicht alltäglich"
};

export function TaskCard({
  task,
  category,
  people,
  due = true,
  onComplete,
  onRequestComplete,
  onEdit,
  onAssign,
  running,
  onStart,
  showKind = false
}: {
  task: Task;
  category?: Category;
  people?: Person[];
  due?: boolean;
  onComplete: (task: Task) => void;
  onRequestComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  running?: number | null;
  onStart?: (task: Task) => void;
  showKind?: boolean;
}) {
  const assigneeId = currentAssignee(task);
  const assignee = people?.find((p) => p.id === assigneeId);
  const isCommunity = !!onRequestComplete;

  const handleCheck = () => {
    if (isCommunity) onRequestComplete!(task);
    else onComplete(task);
  };

  return (
    <div className="task-row" data-testid={`card-task-${task.id}`}>
      <button
        className={`task-check ${!due ? "done" : ""}`}
        disabled={!due}
        onClick={handleCheck}
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
          {showKind ? ` · ${kindLabels[task.taskKind]}` : ""}
          {assignee ? ` · → ${assignee.name}` : people ? " · nicht zugewiesen" : ""}
          {!due && <span className="tag">erledigt</span>}
        </div>
      </div>
      {task.timerEnabled && due && !isCommunity && (
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
      {onAssign && (
        <button className="btn btn-ghost btn-icon" onClick={() => onAssign(task)} data-testid={`button-assign-task-${task.id}`} title="Zuweisen">
          <UserPlus size={16} />
        </button>
      )}
      {onEdit && (
        <button className="btn btn-ghost btn-icon" onClick={() => onEdit(task)} data-testid={`button-edit-${task.id}`}>
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
}

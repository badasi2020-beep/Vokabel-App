import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Category, Task, TaskKind } from "../types";

const kindOptions: { value: TaskKind; label: string }[] = [
  { value: "alltag", label: "Alltagsaufgabe" },
  { value: "putzplan", label: "Putzplan" },
  { value: "sonstiges", label: "Nicht alltäglich" }
];

export function TaskModal({
  task,
  categories,
  defaultCategoryId,
  onSave,
  onClose
}: {
  task?: Task;
  categories: Category[];
  defaultCategoryId?: string;
  onSave: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: task?.name || "",
    categoryId: task?.categoryId || defaultCategoryId || categories[0]?.id || "",
    room: task?.room || "",
    description: task?.description || "",
    points: task?.points?.toString() || "",
    repeatDays: task?.repeatDays?.toString() || "",
    timerEnabled: task?.timerEnabled || false,
    taskKind: task?.taskKind || ("sonstiges" as TaskKind)
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      categoryId: form.categoryId,
      room: form.room || undefined,
      description: form.description || undefined,
      points: form.points === "" ? null : Number(form.points),
      repeatDays: form.repeatDays === "" ? null : Number(form.repeatDays),
      timerEnabled: form.timerEnabled,
      taskKind: form.taskKind,
      assignedPersonId: task?.assignedPersonId ?? null,
      tempAssignedPersonId: task?.tempAssignedPersonId ?? null
    });
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">{task ? "Aufgabe anpassen" : "Neue Aufgabe"}</div>
            <h2 style={{ marginTop: 6 }}>{task ? task.name : "Was steht an?"}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} data-testid="button-close-task-modal">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="task-name">Name</label>
            <input
              id="task-name"
              className="input"
              autoFocus
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Zum Beispiel: Wohnzimmer saugen"
              data-testid="input-task-name"
            />
          </div>
          <div className="field full">
            <label>Art der Aufgabe</label>
            <div className="toolbar" style={{ margin: 0 }}>
              {kindOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-pill ${form.taskKind === option.value ? "active" : ""}`}
                  onClick={() => setForm({ ...form, taskKind: option.value })}
                  data-testid={`button-task-kind-${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-category">Kategorie</label>
            <select
              id="task-category"
              className="select"
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              data-testid="select-task-category"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="task-room">Ort (optional)</label>
            <input
              id="task-room"
              className="input"
              value={form.room}
              onChange={(event) => setForm({ ...form, room: event.target.value })}
              placeholder="z. B. Bad"
              data-testid="input-task-room"
            />
          </div>
          <div className="field">
            <label htmlFor="task-points">Punkte (optional)</label>
            <input
              id="task-points"
              type="number"
              min="0"
              className="input"
              value={form.points}
              onChange={(event) => setForm({ ...form, points: event.target.value })}
              placeholder="Leer = ohne Punkte"
              data-testid="input-task-points"
            />
          </div>
          <div className="field">
            <label htmlFor="task-repeat">Wiederholen alle (Tage)</label>
            <input
              id="task-repeat"
              type="number"
              min="1"
              className="input"
              value={form.repeatDays}
              onChange={(event) => setForm({ ...form, repeatDays: event.target.value })}
              placeholder="Leer = einmalig"
              data-testid="input-task-repeat"
            />
          </div>
          <div className="field full">
            <label htmlFor="task-description">Notiz (optional)</label>
            <textarea
              id="task-description"
              className="textarea"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Alles, was euch hilft"
              data-testid="input-task-description"
            />
          </div>
          <label className="checkline full">
            <input
              type="checkbox"
              checked={form.timerEnabled}
              onChange={(event) => setForm({ ...form, timerEnabled: event.target.checked })}
              data-testid="input-task-timer"
            />{" "}
            Zeit beim Erledigen mitlaufen lassen
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} data-testid="button-cancel-task">
            Abbrechen
          </button>
          <button className="btn btn-primary" data-testid="button-save-task">
            {task ? "Änderungen speichern" : "Aufgabe anlegen"}
          </button>
        </div>
      </form>
    </div>
  );
}

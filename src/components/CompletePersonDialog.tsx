import { X } from "lucide-react";
import { currentAssignee } from "../lib/utils";
import type { Person, Task } from "../types";

export function CompletePersonDialog({
  task,
  people,
  onChoose,
  onClose
}: {
  task: Task;
  people: Person[];
  onChoose: (personId: string) => void;
  onClose: () => void;
}) {
  const assignee = currentAssignee(task);
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Wer hat es erledigt?</div>
            <h2 style={{ marginTop: 6 }}>{task.name}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} data-testid="button-close-complete-person">
            <X size={18} />
          </button>
        </div>
        <div className="settings-list">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              className="settings-item category-row"
              onClick={() => onChoose(person.id)}
              data-testid={`button-complete-as-${person.id}`}
            >
              <div className="person-edit">
                <span className="avatar" style={{ background: person.color }}>
                  {person.initial}
                </span>
                <strong>{person.name}</strong>
              </div>
              {assignee && assignee !== person.id && <span className="tag">Übernahme</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

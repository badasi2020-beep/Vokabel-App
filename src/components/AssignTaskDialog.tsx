import { useState } from "react";
import { X } from "lucide-react";
import type { Person, Task } from "../types";

export function AssignTaskDialog({
  task,
  people,
  onAssign,
  onClose
}: {
  task: Task;
  people: Person[];
  onAssign: (personId: string | null, temporary: boolean) => void;
  onClose: () => void;
}) {
  const [chosenPersonId, setChosenPersonId] = useState<string | null | undefined>(undefined);
  const askTemporary = task.taskKind === "alltag" && chosenPersonId !== undefined && chosenPersonId !== null;

  const choosePerson = (personId: string | null) => {
    if (personId === null) {
      onAssign(null, false);
      return;
    }
    if (task.taskKind !== "alltag") {
      onAssign(personId, false);
      return;
    }
    setChosenPersonId(personId);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Zuweisen</div>
            <h2 style={{ marginTop: 6 }}>{task.name}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} data-testid="button-close-assign">
            <X size={18} />
          </button>
        </div>

        {!askTemporary ? (
          <div className="settings-list">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                className="settings-item category-row"
                onClick={() => choosePerson(person.id)}
                data-testid={`button-assign-${person.id}`}
              >
                <div className="person-edit">
                  <span className="avatar" style={{ background: person.color }}>
                    {person.initial}
                  </span>
                  <strong>{person.name}</strong>
                </div>
              </button>
            ))}
            <button type="button" className="settings-item category-row" onClick={() => choosePerson(null)} data-testid="button-assign-none">
              <strong>Niemandem zuweisen</strong>
            </button>
          </div>
        ) : (
          <div>
            <p className="stat-note" style={{ marginBottom: 14 }}>
              Nur für die nächste Erledigung, oder soll {people.find((p) => p.id === chosenPersonId)?.name} diese
              Alltagsaufgabe dauerhaft übernehmen?
            </p>
            <div className="form-actions" style={{ justifyContent: "stretch", gap: 10 }}>
              <button
                type="button"
                className="btn btn-soft"
                style={{ flex: 1 }}
                onClick={() => onAssign(chosenPersonId as string, true)}
                data-testid="button-assign-once"
              >
                Nur dieses Mal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => onAssign(chosenPersonId as string, false)}
                data-testid="button-assign-always"
              >
                Dauerhaft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

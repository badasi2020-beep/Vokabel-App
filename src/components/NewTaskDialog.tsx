import { useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "../store/store";

export function NewTaskDialog({
  open,
  onClose,
  defaultCategoryId
}: {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: string | null;
}) {
  const { addTask } = useStore();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    addTask({ name, categoryId: defaultCategoryId ?? null });
    setName("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Neue Aufgabe">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-forest-light">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="z.B. Balkon fegen"
            className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
          />
        </div>
        <p className="text-xs text-forest-soft">
          Alles Weitere (Kategorie, Punkte, Wiederholung, Beschreibung) kannst du danach über das
          Info-Symbol der Aufgabe ergänzen.
        </p>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-3 rounded-pill bg-forest text-cream-soft font-medium disabled:opacity-40"
        >
          Aufgabe anlegen
        </button>
      </div>
    </Modal>
  );
}
